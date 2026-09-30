import { expect, it } from 'vitest';
import type { OpenF1Meeting } from '../../../api/openf1';
import { formatCountdown, pickNextMeeting } from '../nextMeeting';

const meeting = (name: string, date_start: string) => ({ meeting_name: name, date_start }) as OpenF1Meeting;
const NOW = Date.parse('2026-09-30T12:00:00Z');

it('picks the earliest meeting that has not started, or null', () => {
  const list = [meeting('Past', '2026-09-01T10:00:00Z'), meeting('Later', '2026-11-01T10:00:00Z'), meeting('Next', '2026-10-04T12:34:00Z')];
  expect(pickNextMeeting(list, NOW)?.name).toBe('Next');
  expect(pickNextMeeting([meeting('Past', '2026-09-01T10:00:00Z')], NOW)).toBeNull();
  expect(pickNextMeeting(null, NOW)).toBeNull();
});

it('formats a countdown as days, hours and minutes and never goes negative', () => {
  expect(formatCountdown(Date.parse('2026-10-04T12:34:00Z') - NOW)).toBe('4d 0h 34m');
  expect(formatCountdown(-5000)).toBe('0d 0h 0m');
});
