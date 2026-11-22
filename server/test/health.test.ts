import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTestApp, type TestCtx } from './helpers.js';
import { createApp } from '../src/app.js';

let ctx: TestCtx;
beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(async () => { await ctx.close(); });

describe('GET /healthz', () => {
  it('reports app and database up', async () => {
    const res = await request(ctx.app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: true });
  });

  it('answers 503 when the database is unreachable', async () => {
    const brokenDb = { selectNoFrom: () => { throw new Error('down'); } } as never;
    const app = createApp({ db: brokenDb, cfg: ctx.cfg });
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, db: false });
  });
});
