import path from 'node:path';

/** Repository root (works from server/src via tsx and from the bundled server/dist). */
export const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');

export type DbClient = 'mysql' | 'pg';

export interface Config {
  dbClient: DbClient;
  databaseUrl: string;
  port: number;
  uploadDir: string;
  publicBaseUrl: string;
  webDist: string;
  isProd: boolean;
  bootstrap: { email?: string; password?: string; name: string };
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const dbClient = env.DB_CLIENT;
  if (dbClient !== 'mysql' && dbClient !== 'pg') {
    throw new Error('DB_CLIENT must be "mysql" or "pg"');
  }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return {
    dbClient,
    databaseUrl: env.DATABASE_URL,
    port: Number(env.PORT ?? 3000),
    uploadDir: path.resolve(PROJECT_ROOT, env.UPLOAD_DIR || './uploads'),
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
    webDist: path.resolve(PROJECT_ROOT, env.WEB_DIST || 'web/dist'),
    isProd: env.NODE_ENV === 'production',
    bootstrap: {
      email: env.ADMIN_BOOTSTRAP_EMAIL || undefined,
      password: env.ADMIN_BOOTSTRAP_PASSWORD || undefined,
      name: env.ADMIN_BOOTSTRAP_NAME || 'Admin',
    },
  };
}
