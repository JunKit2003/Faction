import { z } from 'zod';

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABELS: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
export const SHOP_TIMEZONE = 'Asia/Kuala_Lumpur';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const daySchema = z
  .strictObject({ closed: z.boolean(), open: z.string(), close: z.string() })
  .superRefine((d, ctx) => {
    if (d.closed) return;
    if (!TIME.test(d.open)) ctx.addIssue({ code: 'custom', path: ['open'], message: 'Use 24-hour HH:MM, e.g. 11:00' });
    if (!TIME.test(d.close)) ctx.addIssue({ code: 'custom', path: ['close'], message: 'Use 24-hour HH:MM, e.g. 19:30' });
    else if (TIME.test(d.open) && d.open >= d.close) ctx.addIssue({ code: 'custom', path: ['close'], message: 'Closing time must be after opening time' });
  });

export const hoursSchema = z.strictObject({
  mon: daySchema, tue: daySchema, wed: daySchema, thu: daySchema, fri: daySchema, sat: daySchema, sun: daySchema,
});
export type DayHours = z.infer<typeof daySchema>;
export type Hours = z.infer<typeof hoursSchema>;

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
