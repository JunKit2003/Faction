// In-memory limiter: fine for the single Node process this app runs as.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, number[]>();

const recent = (key: string, now: number) => (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

export function isLimited(key: string, now = Date.now()): boolean {
  return recent(key, now).length >= MAX_FAILURES;
}
export function recordFailure(key: string, now = Date.now()) {
  const list = recent(key, now);
  list.push(now);
  failures.set(key, list);
  if (failures.size > 10_000) for (const [k] of failures) { if (!recent(k, now).length) failures.delete(k); }
}
export function clearFailures(key: string) { failures.delete(key); }
export function resetRateLimits() { failures.clear(); }
