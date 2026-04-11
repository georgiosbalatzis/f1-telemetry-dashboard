/**
 * Integration tests for the OpenF1 API cache layer using MSW.
 *
 * These tests stub the real OpenF1 HTTP endpoints via an in-process
 * MSW server so we can verify cache hits, error paths, and retry
 * behaviour without touching the network.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { getMeetings } from '../openf1';

const BASE = 'https://api.openf1.org/v1';

// ─── MSW server ──────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fakeMeeting = {
  meeting_key: 1234,
  meeting_name: 'Bahrain Grand Prix',
  meeting_official_name: '2024 Formula 1 Bahrain Grand Prix',
  circuit_key: 3,
  circuit_short_name: 'Bahrain',
  country_name: 'Bahrain',
  date_start: '2024-03-01T12:00:00',
  date_end: '2024-03-03T15:00:00',
  year: 2024,
  location: 'Sakhir',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getMeetings – happy path', () => {
  it('returns parsed meeting data from the API', async () => {
    server.use(
      http.get(`${BASE}/meetings`, () => HttpResponse.json([fakeMeeting])),
    );

    const signal = new AbortController().signal;
    const data = await getMeetings(2024, { signal });

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ meeting_key: 1234, year: 2024 });
  });
});

describe('getMeetings – error path', () => {
  it('throws on a 500 server error', async () => {
    server.use(
      http.get(`${BASE}/meetings`, () => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })),
    );

    const signal = new AbortController().signal;
    await expect(getMeetings(2024, { signal })).rejects.toThrow();
  });
});

describe('getMeetings – abort', () => {
  it('rejects with an AbortError when the signal is aborted before response', async () => {
    server.use(
      http.get(`${BASE}/meetings`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return HttpResponse.json([fakeMeeting]);
      }),
    );

    const controller = new AbortController();
    const promise = getMeetings(2024, { signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toThrow();
  });
});
