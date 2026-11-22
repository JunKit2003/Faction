import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SECTION_KEYS, formatHours } from '@faction/shared';
import { sectionSchemas } from '@faction/shared/schemas';
import { setupTestApp, type TestCtx } from './helpers.js';
import { seedIfEmpty } from '../src/seed/run.js';

let ctx: TestCtx;
beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(async () => { await ctx.close(); });

describe('seedIfEmpty', () => {
  it('seeds every section with the current site content, once', async () => {
    expect(await seedIfEmpty(ctx.db, ctx.cfg)).toBe(true);
    const rows = await ctx.db.selectFrom('content_sections').selectAll().execute();
    expect(rows.map((r) => r.key).sort()).toEqual([...SECTION_KEYS].sort());
    const data = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.data)]));
    for (const k of SECTION_KEYS) expect(sectionSchemas[k].safeParse(data[k]).success, k).toBe(true);

    expect(data['home.hero'].title).toBe('Ride _hard._ We’ll keep you *rolling.*');
    expect(data.site.accentColor).toBe('#c6ff3d');
    expect(data.about.secondImageId).not.toBe('');
    expect(data['home.closer'].title).toBe('Get *dialled.*');
    expect(data['home.hero'].slideIds).toHaveLength(3);
    expect(data.faq.items).toHaveLength(9);
    expect(data.faq.items[1].a).toBe('We’re open {hours}.');
    expect(formatHours(data.site.hours)).toEqual(['Mon–Fri · 11:00–19:30', 'Sat · 11:00–16:00', 'Sun · Closed']);
    expect(data.about.story[0]).toMatch(/^Faction Bikeworks started as one person fixing friends’ bikes at home/);
    expect(data.media.imageIds).toHaveLength(9);

    const media = await ctx.db.selectFrom('media').selectAll().execute();
    expect(media).toHaveLength(12); // 9 photos + 3 logos
    expect(media.find((m) => m.original_name === 'hero1.jpeg')!.alt).toBe('Mountain biking backdrop');

    expect(await seedIfEmpty(ctx.db, ctx.cfg)).toBe(false);
    expect(await ctx.db.selectFrom('media').select('id').execute()).toHaveLength(12);
  }, 120_000);
});
