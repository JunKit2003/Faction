import { loadConfig } from './config.js';
import { createDb } from './db/index.js';
import { migrateToLatest } from './db/migrations.js';
import { createApp } from './app.js';
import { startup } from './startup.js';

const cfg = loadConfig();
const db = createDb(cfg);
await migrateToLatest(db);
await startup(db, cfg);
const app = createApp({ db, cfg });
const server = app.listen(cfg.port, () => {
  console.log(`Faction Bikeworks listening on :${cfg.port} (db: ${cfg.dbClient})`);
});

const shutdown = () => {
  server.close(() => void db.destroy().then(() => process.exit(0)));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
