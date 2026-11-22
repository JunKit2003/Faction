export type RichToken =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'link'; text: string; href: string };

/** Allowed link targets: http(s), mailto, tel, site-relative paths and in-page anchors. */
export function isSafeHref(href: string): boolean {
  if (/^\/(?!\/)/.test(href) || href.startsWith('#')) return true;
  return /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)$/i.test(href);
}

const TOKEN = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+(?:\([^)\s]*\))?[^)\s]*)\)/g;

/** Tiny inline markup: **bold** and [label](href). Everything else is literal text. */
export function parseRich(input: string): RichToken[] {
  const out: RichToken[] = [];
  const push = (text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last?.type === 'text') last.text += text;
    else out.push({ type: 'text', text });
  };
  let i = 0;
  for (const m of input.matchAll(TOKEN)) {
    push(input.slice(i, m.index));
    if (m[1] !== undefined) out.push({ type: 'bold', text: m[1] });
    else if (isSafeHref(m[3]!)) out.push({ type: 'link', text: m[2]!, href: m[3]! });
    else push(m[0]);
    i = m.index + m[0].length;
  }
  push(input.slice(i));
  return out;
}
