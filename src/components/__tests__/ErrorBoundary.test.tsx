import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';

// Suppress React's error boundary console noise in test output
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Boom!');
  return <div>Safe content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary label="Telemetry">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders the fallback UI when a child throws', () => {
    render(
      <ErrorBoundary label="Telemetry">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Failed to render Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText('Boom!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('clears the error and re-renders children when Retry is clicked', async () => {
    const user = userEvent.setup();

    // Render a component we can control — start throwing, then stop
    let shouldThrow = true;
    function Controlled() {
      if (shouldThrow) throw new Error('Controlled error');
      return <div>Recovered</div>;
    }

    const { rerender } = render(
      <ErrorBoundary label="Telemetry">
        <Controlled />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Failed to render Telemetry/i)).toBeInTheDocument();

    // Stop throwing before clicking retry
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /retry/i }));

    // Re-render to pick up the new shouldThrow value
    rerender(
      <ErrorBoundary label="Telemetry">
        <Controlled />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('resets automatically when resetKey changes', () => {
    const { rerender } = render(
      <ErrorBoundary label="Telemetry" resetKey="v1">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Failed to render Telemetry/i)).toBeInTheDocument();

    // Change the resetKey — boundary should clear the error
    rerender(
      <ErrorBoundary label="Telemetry" resetKey="v2">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});
