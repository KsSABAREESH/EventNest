const { getPool } = require('@eventnest/shared');

async function createUser({ email, passwordHash }) {
  const result = await getPool().query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, role, created_at`,
    [email, passwordHash],
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await getPool().query(
    `SELECT id, email, password_hash, role, created_at
     FROM users
     WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}

module.exports = { createUser, findUserByEmail };
