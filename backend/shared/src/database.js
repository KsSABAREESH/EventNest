const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required to connect to PostgreSQL');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      application_name: 'eventnest',
    });
    pool.on('error', (error) => {
      process.stderr.write(`${JSON.stringify({ level: 'error', service: 'database', msg: 'PostgreSQL idle client error', error: error.message })}\n`);
    });
  }
  return pool;
}

async function checkDatabase() {
  await getPool().query('SELECT 1');
}

async function closeDatabase() {
  if (pool) {
    const currentPool = pool;
    pool = undefined;
    await currentPool.end();
  }
}

module.exports = { checkDatabase, closeDatabase, getPool };
