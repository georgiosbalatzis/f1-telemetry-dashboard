import type { OpenF1Meeting } from '../../api/openf1';

/** The earliest meeting that has not started yet, or null when the loaded season has none. */
export function pickNextMeeting(meetings: OpenF1Meeting[] | null | undefined, now = Date.now()): { name: string; start: number } | null {
  const upcoming = (meetings ?? [])
    .map((meeting) => ({ name: meeting.meeting_name, start: Date.parse(meeting.date_start) }))
    .filter((meeting) => Number.isFinite(meeting.start) && meeting.start > now)
    .sort((a, b) => a.start - b.start);
  return upcoming[0] ?? null;
}

/** "4d 0h 34m" like the site's masthead countdown. */
export function formatCountdown(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  return `${days}d ${hours}h ${totalMinutes % 60}m`;
}
