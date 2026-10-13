const { getPool } = require('@eventnest/shared');

function buildFeedWhere({ userId, category, city, search }) {
  const values = [userId];
  const conditions = [`EXISTS (
    SELECT 1 FROM user_favourite_categories favourite
    WHERE favourite.user_id = $1 AND favourite.category = events.category
  )`, 'is_active = TRUE', 'starts_at > NOW()'];
  if (category) { values.push(category); conditions.push(`category = $${values.length}`); }
  if (city) { values.push(city); conditions.push(`LOWER(city) = LOWER($${values.length})`); }
  if (search) { values.push(search); conditions.push(`search_document @@ WEBSEARCH_TO_TSQUERY('simple', $${values.length})`); }
  return { where: conditions.join(' AND '), values };
}

async function browseForUser({ userId, category, city, search, page, pageSize }) {
  const pool = getPool();
  const offset = (page - 1) * pageSize;
  const { where, values } = buildFeedWhere({ userId, category, city, search });
  const listValues = [...values, pageSize, offset];
  const [events, count] = await Promise.all([
    pool.query(`SELECT id, title, category, city, starts_at, price_paise, description, image_url
      FROM events WHERE ${where} ORDER BY starts_at ASC, id ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, listValues),
    pool.query(`SELECT COUNT(*)::BIGINT AS total FROM events WHERE ${where}`, values),
  ]);
  return { events: events.rows, totalItems: Number(count.rows[0].total) };
}

module.exports = { browseForUser, buildFeedWhere };
