import { loadConfig } from '../config.js';
import { createDb } from '../db/index.js';
import { migrateToLatest } from '../db/migrations.js';

const db = createDb(loadConfig());
await migrateToLatest(db);
console.log('Migrations up to date.');
await db.destroy();
