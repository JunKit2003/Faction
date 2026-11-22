import { loadConfig } from '../config.js';
import { createDb } from '../db/index.js';
import { migrateToLatest } from '../db/migrations.js';
import { seedIfEmpty } from '../seed/run.js';

const cfg = loadConfig();
const db = createDb(cfg);
await migrateToLatest(db);
console.log((await seedIfEmpty(db, cfg)) ? 'Seeded site content and images.' : 'Content already exists; nothing to seed.');
await db.destroy();
