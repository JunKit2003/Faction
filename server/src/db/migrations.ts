import { sql, type Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';
import { isMysql } from './index.js';
import type { DB } from './types.js';

// Only portable types: varchar, text (longtext on MySQL), integer.
function migrations(mysql: boolean): Record<string, Migration> {
  const longText = mysql ? sql`longtext` : sql`text`;
  return {
    '0001_initial': {
      async up(db: Kysely<any>) {
        await db.schema.createTable('users')
          .addColumn('id', 'varchar(26)', (c) => c.primaryKey())
          .addColumn('email', 'varchar(254)', (c) => c.notNull().unique())
          .addColumn('name', 'varchar(120)', (c) => c.notNull())
          .addColumn('password_hash', 'varchar(255)', (c) => c.notNull())
          .addColumn('created_at', 'varchar(32)', (c) => c.notNull())
          .addColumn('last_login_at', 'varchar(32)')
          .addColumn('disabled_at', 'varchar(32)')
          .execute();
        await db.schema.createTable('sessions')
          .addColumn('id', 'varchar(64)', (c) => c.primaryKey())
          .addColumn('user_id', 'varchar(26)', (c) => c.notNull())
          .addColumn('expires_at', 'varchar(32)', (c) => c.notNull())
          .addColumn('ip', 'varchar(64)', (c) => c.notNull())
          .addColumn('user_agent', 'varchar(512)', (c) => c.notNull())
          .execute();
        await db.schema.createIndex('sessions_user_id').on('sessions').column('user_id').execute();
        await db.schema.createTable('content_sections')
          .addColumn('key', 'varchar(64)', (c) => c.primaryKey())
          .addColumn('data', longText, (c) => c.notNull())
          .addColumn('version', 'integer', (c) => c.notNull())
          .addColumn('updated_at', 'varchar(32)', (c) => c.notNull())
          .addColumn('updated_by', 'varchar(26)')
          .execute();
        await db.schema.createTable('media')
          .addColumn('id', 'varchar(26)', (c) => c.primaryKey())
          .addColumn('filename', 'varchar(255)', (c) => c.notNull())
          .addColumn('original_name', 'varchar(255)', (c) => c.notNull())
          .addColumn('mime', 'varchar(64)', (c) => c.notNull())
          .addColumn('width', 'integer', (c) => c.notNull())
          .addColumn('height', 'integer', (c) => c.notNull())
          .addColumn('alt', 'varchar(500)', (c) => c.notNull())
          .addColumn('created_at', 'varchar(32)', (c) => c.notNull())
          .addColumn('created_by', 'varchar(26)')
          .addColumn('deleted_at', 'varchar(32)')
          .execute();
        await db.schema.createTable('audit_log')
          .addColumn('id', 'varchar(26)', (c) => c.primaryKey())
          .addColumn('at', 'varchar(32)', (c) => c.notNull())
          .addColumn('user_id', 'varchar(26)')
          .addColumn('user_email', 'varchar(254)', (c) => c.notNull())
          .addColumn('action', 'varchar(64)', (c) => c.notNull())
          .addColumn('target_type', 'varchar(32)', (c) => c.notNull())
          .addColumn('target_key', 'varchar(64)', (c) => c.notNull())
          .addColumn('before', longText)
          .addColumn('after', longText)
          .addColumn('ip', 'varchar(64)', (c) => c.notNull())
          .execute();
        await db.schema.createIndex('audit_log_at').on('audit_log').column('at').execute();
        await db.schema.createIndex('audit_log_target').on('audit_log').columns(['target_key', 'at']).execute();
        await db.schema.createIndex('audit_log_user').on('audit_log').columns(['user_id', 'at']).execute();
      },
    },
  };
}

export async function migrateToLatest(db: Kysely<DB>): Promise<void> {
  const provider: MigrationProvider = { getMigrations: async () => migrations(isMysql(db)) };
  const { error, results } = await new Migrator({ db, provider }).migrateToLatest();
  const failed = results?.find((r) => r.status === 'Error');
  if (error || failed) {
    throw new Error(`Migration failed${failed ? ` (${failed.migrationName})` : ''}: ${String(error)}`);
  }
}
