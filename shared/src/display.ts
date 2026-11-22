export type DisplayToken = { type: 'plain' | 'outline' | 'accent'; text: string };

const MARK = /_([^_\n]+)_|\*([^*\n]+)\*/g;

/** Headline accents: _outlined_ words and *lime* words. Everything else is plain text. */
export function parseDisplay(input: string): DisplayToken[] {
  const out: DisplayToken[] = [];
  let i = 0;
  for (const m of input.matchAll(MARK)) {
    if (m.index > i) out.push({ type: 'plain', text: input.slice(i, m.index) });
    out.push(m[1] !== undefined ? { type: 'outline', text: m[1] } : { type: 'accent', text: m[2]! });
    i = m.index + m[0].length;
  }
  if (i < input.length) out.push({ type: 'plain', text: input.slice(i) });
  return out;
}

export const plainDisplay = (input: string) => parseDisplay(input).map((t) => t.text).join('');
