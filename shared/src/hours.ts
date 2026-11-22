export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABELS: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
export const SHOP_TIMEZONE = 'Asia/Kuala_Lumpur';

export interface DayHours { closed: boolean; open: string; close: string }
export type Hours = Record<Day, DayHours>;

const dayText = (d: DayHours) => (d.closed ? 'Closed' : `${d.open}–${d.close}`);

/** Groups consecutive days with identical hours: ["Mon–Fri · 11:00–19:30", "Sat · 11:00–16:00", "Sun · Closed"]. */
export function formatHours(h: Hours): string[] {
  const lines: string[] = [];
  let start = 0;
  for (let i = 1; i <= DAYS.length; i++) {
    const prev = dayText(h[DAYS[i - 1]!]);
    if (i < DAYS.length && dayText(h[DAYS[i]!]) === prev) continue;
    const from = DAY_LABELS[DAYS[start]!];
    const to = DAY_LABELS[DAYS[i - 1]!];
    lines.push(`${start === i - 1 ? from : `${from}–${to}`} · ${prev}`);
    start = i;
  }
  return lines;
}

export function fillHours(text: string, h: Hours): string {
  return text.includes('{hours}') ? text.replaceAll('{hours}', formatHours(h).join(', ')) : text;
}

/** Day + HH:MM of `date` in the shop's timezone. */
export function shopClock(date: Date, tz = SHOP_TIMEZONE): { day: Day; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = get('weekday').slice(0, 3).toLowerCase() as Day;
  return { day, time: `${get('hour')}:${get('minute')}` };
}

export function isOpenAt(h: Hours, date: Date, tz = SHOP_TIMEZONE): boolean {
  const { day, time } = shopClock(date, tz);
  const d = h[day];
  return !!d && !d.closed && time >= d.open && time < d.close;
}
