export function yearsSince(openedYear: number, now = new Date()): number {
  return Math.max(1, now.getFullYear() - openedYear);
}

export interface SplitNumber { prefix: string; value: number; decimals: number; grouped: boolean; suffix: string }

/** "1,800+" → {value: 1800, grouped: true, suffix: "+"} so the number can count up and keep its formatting. */
export function splitNumber(text: string): SplitNumber | null {
  const m = text.match(/^(\D*?)(\d[\d,]*)(?:\.(\d+))?(.*)$/);
  if (!m) return null;
  const whole = m[2]!;
  return {
    prefix: m[1]!,
    value: Number(whole.replace(/,/g, '') + (m[3] ? `.${m[3]}` : '')),
    decimals: m[3]?.length ?? 0,
    grouped: whole.includes(','),
    suffix: m[4]!,
  };
}

export function formatSplit(s: SplitNumber, n: number): string {
  const num = n.toLocaleString('en-US', { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals, useGrouping: s.grouped });
  return `${s.prefix}${num}${s.suffix}`;
}
