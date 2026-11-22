import type { ErrorRequestHandler, Request } from 'express';
import type { z } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

export interface Issue { path: string; message: string }

export function toIssues(err: z.ZodError): Issue[] {
  return err.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }));
}

/** Parse or throw 422 with field issues. */
export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const r = schema.safeParse(body);
  if (!r.success) throw new HttpError(422, 'Please fix the highlighted fields.', { issues: toIssues(r.error) });
  return r.data;
}

export const clientIp = (req: Request) => (req.ip ?? '').slice(0, 64);

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...err.extra });
    return;
  }
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
