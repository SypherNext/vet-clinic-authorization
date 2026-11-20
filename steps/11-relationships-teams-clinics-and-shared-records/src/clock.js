// The app asks this object for the time instead of calling Date.now()
// directly. Tests pass in a fake clock they can move forward, so they can
// check "this code expires after 10 minutes" without waiting 10 minutes.
export const systemClock = {
  now: () => Date.now(),
};

const DAY_MS = 24 * 60 * 60 * 1000;

// The date as "2026-11-05" (in UTC), the format the database keeps dates in.
// Dates in this format sort and compare correctly as plain text.
export function dateOf(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayOf(clock) {
  return dateOf(clock.now());
}

// dateDaysFrom(now, -4) is the date four days ago.
export function dateDaysFrom(ms, days) {
  return dateOf(ms + days * DAY_MS);
}
