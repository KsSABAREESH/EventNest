const { getPool } = require('@eventnest/shared');

async function listMembers({ search, page, pageSize }) {
  const pool = getPool();
  const conditions = ["role = 'member'"];
  const values = [];
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(email ILIKE $${values.length} OR username ILIKE $${values.length})`);
  }
  const where = conditions.join(' AND ');
  const offset = (page - 1) * pageSize;
  const [usersResult, countResult] = await Promise.all([
    pool.query(`SELECT id, email, role, username, created_at FROM users WHERE ${where} ORDER BY created_at DESC, id ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, pageSize, offset]),
    pool.query(`SELECT COUNT(*)::BIGINT AS total FROM users WHERE ${where}`, values),
  ]);
  return { users: usersResult.rows, totalItems: Number(countResult.rows[0].total) };
}

async function findMemberById(userId) {
  const result = await getPool().query(`SELECT id, email, role, username, created_at, updated_at FROM users WHERE id = $1 AND role = 'member'`, [userId]);
  return result.rows[0] ?? null;
}

module.exports = { findMemberById, listMembers };
