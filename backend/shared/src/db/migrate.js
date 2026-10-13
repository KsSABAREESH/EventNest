const fs = require('node:fs/promises');
const path = require('node:path');
const pino = require('pino');
const { loadEnvironment } = require('../config');
const { closeDatabase, getPool } = require('../database');
const { createLoggerOptions } = require('../logger');

const logger = pino(createLoggerOptions('database-migrations'));
const migrationsDirectory = path.resolve(__dirname, '../../migrations');
const migrationLockId = 584_219_202;

async function runMigrations() {
  loadEnvironment();
  const client = await getPool().connect();
  let hasLock = false;

  try {
    await client.query('SELECT pg_advisory_lock($1::BIGINT)', [migrationLockId]);
    hasLock = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => /^\d+_[a-z0-9_]+\.sql$/i.test(file))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query('SELECT 1 FROM schema_migrations WHERE id = $1', [file]);
      if (alreadyApplied.rowCount > 0) {
        logger.info({ migration: file }, 'Migration already applied');
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info({ migration: file }, 'Migration applied');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    if (hasLock) await client.query('SELECT pg_advisory_unlock($1::BIGINT)', [migrationLockId]);
    client.release();
    await closeDatabase();
  }
}

runMigrations().catch((error) => {
  logger.fatal({ err: error }, 'Database migrations failed');
  process.exitCode = 1;
});
