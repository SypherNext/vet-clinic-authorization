// The app asks this object for the time instead of calling Date.now()
// directly. Tests pass in a fake clock they can move forward, so they can
// check "this code expires after 10 minutes" without waiting 10 minutes.
export const systemClock = {
  now: () => Date.now(),
};
