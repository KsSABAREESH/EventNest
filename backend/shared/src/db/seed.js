const fs = require('node:fs/promises');
const path = require('node:path');
const pino = require('pino');
const { loadEnvironment } = require('../config');
const { closeDatabase, getPool } = require('../database');
const { createLoggerOptions } = require('../logger');

const logger = pino(createLoggerOptions('database-seed'));
const seedFile = path.resolve(__dirname, '../../seeds/events.sql');

async function seedDatabase() {
  loadEnvironment();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(await fs.readFile(seedFile, 'utf8'));
    await client.query('COMMIT');
    logger.info('Sample event seed completed');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closeDatabase();
  }
}

seedDatabase().catch((error) => {
  logger.fatal({ err: error }, 'Database seed failed');
  process.exitCode = 1;
});
