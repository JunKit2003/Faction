import type { Kysely } from 'kysely';
import type { Config } from './config.js';
import type { DB } from './db/types.js';
import { bootstrapAdmin } from './auth/bootstrap.js';
import { seedIfEmpty } from './seed/run.js';
import { upgradeContent } from './seed/upgrade.js';

/** Runs once at boot after migrations. */
export async function startup(db: Kysely<DB>, cfg: Config): Promise<void> {
  if (await seedIfEmpty(db, cfg)) console.log('Seeded site content and images.');
  const upgraded = await upgradeContent(db);
  if (upgraded.length) console.log(`Upgraded content sections: ${upgraded.join(', ')}`);
  if (await bootstrapAdmin(db, cfg.bootstrap)) console.log(`Created first admin ${cfg.bootstrap.email}.`);
}
