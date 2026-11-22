import type { Kysely } from 'kysely';
import type { Config } from './config.js';
import type { DB } from './db/types.js';

/** Runs once at boot after migrations. Later tasks add admin bootstrap and seeding. */
export async function startup(_db: Kysely<DB>, _cfg: Config): Promise<void> {}
