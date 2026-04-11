import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  label: string;
  resetKey?: string | number;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[ErrorBoundary] ${this.props.label}`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="dashboard-panel flex flex-col items-center justify-center gap-4 rounded-[16px] p-8 text-center sm:rounded-[18px]">
        <div>
          <p className="text-sm font-semibold text-red-300">Failed to render {this.props.label}.</p>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">{this.state.error.message || 'Unexpected render error'}</p>
        </div>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="rounded-[10px] border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-hover)]"
        >
          Retry
        </button>
      </div>
    );
  }
}
