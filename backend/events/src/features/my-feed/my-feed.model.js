const { getPool } = require('@eventnest/shared');

function buildMyFeedWhere({ userId, category, city, search }) {
  const values = [userId];
  const conditions = [
    `EXISTS (
      SELECT 1 FROM user_favourite_categories favourite
      WHERE favourite.user_id = $1 AND favourite.category = events.category
    )`,
    'is_active = TRUE',
    'starts_at > NOW()',
  ];

  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (city) {
    values.push(city);
    conditions.push(`LOWER(city) = LOWER($${values.length})`);
  }
  if (search) {
    values.push(search);
    conditions.push(`search_document @@ WEBSEARCH_TO_TSQUERY('simple', $${values.length})`);
  }

  return { where: conditions.join(' AND '), values };
}

async function browseForUser(filters) {
  const pool = getPool();
  const { where, values } = buildMyFeedWhere(filters);
  const offset = (filters.page - 1) * filters.pageSize;
  const listValues = [...values, filters.pageSize, offset];
  const [events, count] = await Promise.all([
    pool.query(
      `SELECT id, title, category, city, starts_at, price_paise, description, image_url
       FROM events WHERE ${where}
       ORDER BY starts_at ASC, id ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      listValues,
    ),
    pool.query(`SELECT COUNT(*)::BIGINT AS total FROM events WHERE ${where}`, values),
  ]);

  return { events: events.rows, totalItems: Number(count.rows[0].total) };
}

module.exports = { browseForUser, buildMyFeedWhere };
