const pad = (n: number) => String(n).padStart(2, '0');

/** Local date as "YYYY-MM-DD" (not UTC, so late-night entries stay on the right day). */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** The last `count` days ending at `endKey`, oldest first. */
export function lastDays(endKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(endKey, i - count + 1));
}

export function formatWeekday(key: string): string {
  return fromDateKey(key).toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatLongDate(key: string): string {
  return fromDateKey(key).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}
