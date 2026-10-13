const { getPool } = require('@eventnest/shared');

async function getCategories(userId) {
  const result = await getPool().query(
    'SELECT category FROM user_favourite_categories WHERE user_id = $1 ORDER BY category',
    [userId],
  );
  return result.rows.map((row) => row.category);
}

async function replaceCategories(userId, categories) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_favourite_categories WHERE user_id = $1', [userId]);
    for (const category of categories) {
      await client.query(
        'INSERT INTO user_favourite_categories (user_id, category) VALUES ($1, $2)',
        [userId, category],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return categories;
}

module.exports = { getCategories, replaceCategories };
