const { getPool } = require('@eventnest/shared');

function buildBrowseWhere(filters) {
  const conditions = ['is_active = TRUE', 'starts_at > NOW()'];
  const values = [];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`category = $${values.length}`);
  }
  if (filters.city) {
    values.push(filters.city);
    conditions.push(`LOWER(city) = LOWER($${values.length})`);
  }
  if (filters.search) {
    values.push(filters.search);
    conditions.push(`search_document @@ WEBSEARCH_TO_TSQUERY('simple', $${values.length})`);
  }

  return { where: conditions.join(' AND '), values };
}

async function browseUpcoming(filters) {
  const pool = getPool();
  const { where, values } = buildBrowseWhere(filters);
  const offset = (filters.page - 1) * filters.pageSize;
  const listValues = [...values, filters.pageSize, offset];

  const [eventsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, title, category, city, starts_at, price_paise, description, image_url
       FROM events
       WHERE ${where}
       ORDER BY starts_at ASC, id ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      listValues,
    ),
    pool.query(`SELECT COUNT(*)::BIGINT AS total FROM events WHERE ${where}`, values),
  ]);

  return {
    events: eventsResult.rows,
    totalItems: Number(countResult.rows[0].total),
  };
}

module.exports = { browseUpcoming };
