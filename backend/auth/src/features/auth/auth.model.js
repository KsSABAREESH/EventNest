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
    `SELECT id, email, password_hash, role, username, mobile_number, photo_url, created_at
     FROM users
     WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}

async function findUserById(id) {
  const result = await getPool().query(
    `SELECT id, email, role, username, mobile_number, photo_url
     FROM users
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function updateUserProfile({ id, username, mobileNumber, photoUrl }) {
  const result = await getPool().query(
    `UPDATE users
     SET username = $2, mobile_number = $3, photo_url = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, role, username, mobile_number, photo_url`,
    [id, username, mobileNumber, photoUrl],
  );
  return result.rows[0] ?? null;
}

module.exports = { createUser, findUserByEmail, findUserById, updateUserProfile };
