export interface Option { value: string; label: string }

interface Base { name: string; label: string; hint?: string }
export type Field =
  | (Base & { kind: 'text' | 'textarea' | 'rich' | 'url' | 'color'; placeholder?: string })
  | (Base & { kind: 'number'; min?: number; max?: number })
  | (Base & { kind: 'select'; options: Option[] | ((root: unknown) => Option[]); numeric?: boolean })
  | (Base & { kind: 'media'; purpose?: 'logo' })
  | (Base & { kind: 'mediaList' })
  | (Base & { kind: 'hours' })
  | (Base & { kind: 'group'; fields: Field[] })
  | (Base & { kind: 'list'; itemLabel: string; newItem: unknown; fields?: Field[]; itemKind?: 'text' | 'textarea' | 'rich' });

export type Issues = Record<string, string>;

export const joinPath = (prefix: string, name: string | number) => (prefix ? `${prefix}.${name}` : String(name));

/** True if any issue sits at or below `path`. */
export const hasIssueUnder = (issues: Issues, path: string) => Object.keys(issues).some((k) => k === path || k.startsWith(path + '.'));

export const RICH_HINT = 'Use **bold** for bold, and [link text](/contact) for links.';
