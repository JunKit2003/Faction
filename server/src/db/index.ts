import { Kysely, MysqlDialect, PostgresDialect, MysqlAdapter } from 'kysely';
import pg from 'pg';
import { createPool } from 'mysql2';
import type { Config } from '../config.js';
import type { DB } from './types.js';

export type { DB } from './types.js';

export function createDb(cfg: Pick<Config, 'dbClient' | 'databaseUrl'>): Kysely<DB> {
  if (cfg.dbClient === 'pg') {
    return new Kysely<DB>({
      dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: cfg.databaseUrl, max: 10 }) }),
    });
  }
  return new Kysely<DB>({
    dialect: new MysqlDialect({
      pool: createPool({ uri: cfg.databaseUrl, connectionLimit: 10, charset: 'utf8mb4', timezone: 'Z' }),
    }),
  });
}

export function isMysql(db: Kysely<DB>): boolean {
  return db.getExecutor().adapter instanceof MysqlAdapter;
}
