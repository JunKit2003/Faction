import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SECTION_KEYS } from '@faction/shared';
import { sectionSchemas } from '@faction/shared/schemas';
import { setupTestApp, type TestCtx } from './helpers.js';
import { nowIso } from '../src/db/ids.js';
import { upgradeContent } from '../src/seed/upgrade.js';

let ctx: TestCtx;
beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(async () => { await ctx.close(); });
beforeEach(async () => { await ctx.reset(); });

// Shape of content saved by the first release (before the v2 design).
const v1 = {
  site: { name: 'Faction Bikeworks', accentColor: '#38bdf8', logoOnLightId: 'L', logoOnDarkId: 'D', faviconId: 'F', openedYear: 2022, whatsappNumber: '601133321767', address: 'Addr',
    hours: { mon: { closed: false, open: '10:00', close: '19:30' }, tue: { closed: false, open: '11:00', close: '19:30' }, wed: { closed: false, open: '11:00', close: '19:30' }, thu: { closed: false, open: '11:00', close: '19:30' }, fri: { closed: false, open: '11:00', close: '19:30' }, sat: { closed: false, open: '11:00', close: '16:00' }, sun: { closed: true, open: '', close: '' } },
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=x', socials: [], labels: { hours: 'Waktu', address: 'Alamat', contact: 'Hubungi' } },
  'home.hero': { title: 'Owner edited title', text: 't', primary: { label: 'a', href: '/' }, secondary: { label: 'b', href: '/' }, slideIds: ['S'] },
};

async function insert(key: string, data: unknown, version = 3) {
  await ctx.db.insertInto('content_sections').values({ key, data: JSON.stringify(data), version, updated_at: nowIso(), updated_by: null }).execute();
}
async function read(key: string) {
  const r = await ctx.db.selectFrom('content_sections').selectAll().where('key', '=', key).executeTakeFirstOrThrow();
  return { data: JSON.parse(r.data), version: Number(r.version) };
}

describe('upgradeContent', () => {
  it('adds new fields and sections while keeping everything the owner edited', async () => {
    await insert('site', v1.site);
    await insert('home.hero', v1['home.hero']);
    const changed = await upgradeContent(ctx.db);
    expect(changed).toEqual(expect.arrayContaining(['site', 'home.hero', 'home.ticker', 'home.reasons', 'home.closer']));

    const site = await read('site');
    expect(site.data.accentColor).toBe('#38bdf8');
    expect(site.data.hours.mon.open).toBe('10:00');
    expect(site.data.labels).toEqual({ hours: 'Waktu', address: 'Alamat', contact: 'Hubungi', open: 'Open now', closed: 'Closed, gone riding' });
    expect(site.data.coordinates).toBe('3.1434° N, 101.6324° E');
    expect(site.version).toBe(4);

    const hero = await read('home.hero');
    expect(hero.data.title).toBe('Owner edited title');
    expect(hero.data.slideIds).toEqual(['S']);
    expect(typeof hero.data.badgeTitle).toBe('string');

    const closer = await read('home.closer');
    expect(sectionSchemas['home.closer'].safeParse(closer.data).success).toBe(true);
    expect(closer.version).toBe(1);
  });

  it('leaves every section valid against today’s schema', async () => {
    await insert('site', v1.site);
    await insert('home.hero', v1['home.hero']);
    await upgradeContent(ctx.db);
    for (const k of ['site', 'home.hero', 'home.ticker', 'home.reasons', 'home.closer'] as const) {
      const r = sectionSchemas[k].safeParse((await read(k)).data);
      expect(r.success, `${k}: ${JSON.stringify(r.error?.issues)}`).toBe(true);
    }
  });

  it('is a no-op on an empty database (seeding handles that) and on up-to-date content', async () => {
    expect(await upgradeContent(ctx.db)).toEqual([]);
    await insert('site', v1.site);
    await upgradeContent(ctx.db);
    const before = await read('site');
    expect(await upgradeContent(ctx.db)).toEqual([]);
    expect((await read('site')).version).toBe(before.version);
  });

  it('never invents keys the schema would reject', async () => {
    await insert('site', v1.site);
    await upgradeContent(ctx.db);
    const keys = (await ctx.db.selectFrom('content_sections').select('key').execute()).map((r) => r.key);
    for (const k of keys) expect(SECTION_KEYS as readonly string[]).toContain(k);
  });
});
