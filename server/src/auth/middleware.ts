import type { RequestHandler, Response } from 'express';
import type { Kysely } from 'kysely';
import type { Config } from '../config.js';
import type { DB } from '../db/types.js';
import { getSessionAdmin, SESSION_COOKIE, SESSION_MS } from './sessions.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { admin?: { id: string; email: string; name: string; sessionId: string } }
  }
}

export function setSessionCookie(res: Response, token: string, cfg: Config) {
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: cfg.secureCookies, maxAge: SESSION_MS, path: '/' });
}

export function requireAdmin(db: Kysely<DB>, cfg: Config): RequestHandler {
  return async (req, res, next) => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    const admin = await getSessionAdmin(db, token);
    if (!admin) {
      res.status(401).json({ error: 'Please sign in.' });
      return;
    }
    if (admin.refreshed && token) setSessionCookie(res, token, cfg);
    req.admin = { id: admin.id, email: admin.email, name: admin.name, sessionId: admin.sessionId };
    next();
  };
}

/** CSRF guard: state-changing requests must come from our own origin. */
export function originCheck(cfg: Config): RequestHandler {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin') ?? (req.get('referer') ? safeOrigin(req.get('referer')!) : null);
    const allowed = new Set([cfg.publicBaseUrl, `${req.protocol}://${req.get('host')}`]);
    if (origin && allowed.has(origin)) return next();
    res.status(403).json({ error: 'Request blocked: unexpected origin.' });
  };
}

function safeOrigin(url: string): string | null {
  try { return new URL(url).origin; } catch { return null; }
}
