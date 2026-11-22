import { describe, expect, it } from 'vitest';
import { SECTION_KEYS } from '@faction/shared';
import { sectionSchemas } from '@faction/shared/schemas';
import { ADMIN_PAGES, findTabForSection, fieldsForCard } from '../../src/admin/structure';
import { SECTION_DEFS } from '../../src/admin/sections/defs';

const schemaKeys = (k: (typeof SECTION_KEYS)[number]) => Object.keys((sectionSchemas[k] as unknown as { shape: Record<string, unknown> }).shape);

describe('admin structure', () => {
  it('puts every editable field of every section in exactly one card', () => {
    const seen = new Map<string, number>();
    for (const p of ADMIN_PAGES) for (const t of p.tabs) for (const c of t.cards) for (const f of c.fields) {
      const id = `${c.section}.${f}`;
      seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    for (const k of SECTION_KEYS) for (const f of schemaKeys(k)) {
      expect(seen.get(`${k}.${f}`), `${k}.${f}`).toBe(1);
    }
  });

  it('only references fields that have an editor', () => {
    for (const p of ADMIN_PAGES) for (const t of p.tabs) for (const c of t.cards) {
      expect(fieldsForCard(c).map((f) => f.name)).toEqual(c.fields);
      for (const f of c.fields) expect(SECTION_DEFS[c.section].fields.some((d) => d.name === f), `${c.section}.${f}`).toBe(true);
    }
  });

  it('uses short task-based names in the menu', () => {
    expect(ADMIN_PAGES.map((p) => p.label)).toEqual(['Shop details', 'Homepage', 'Pages', 'Menu & footer', 'Search & sharing']);
    expect(ADMIN_PAGES.find((p) => p.id === 'shop')!.tabs.map((t) => t.label)).toEqual(['Basics', 'Opening hours', 'Map', 'Branding', 'Social links', 'Labels']);
  });

  it('finds where a section lives, for old links', () => {
    expect(findTabForSection('home.stats')).toEqual({ page: 'homepage', tab: 'stats' });
    expect(findTabForSection('site')).toEqual({ page: 'shop', tab: 'basics' });
  });
});
