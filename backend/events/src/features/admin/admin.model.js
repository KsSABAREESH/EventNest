const { getPool } = require('@eventnest/shared');

const editableColumns = {
  title: 'title',
  category: 'category',
  city: 'city',
  startsAt: 'starts_at',
  pricePaise: 'price_paise',
  description: 'description',
  imageUrl: 'image_url',
};

function buildWhere(filters) {
  const conditions = [];
  const values = [];

  if (filters.status === 'active') conditions.push('is_active = TRUE');
  if (filters.status === 'inactive') conditions.push('is_active = FALSE');
  if (filters.category) {
    values.push(filters.category);
    conditions.push(`category = $${values.length}`);
  }
  if (filters.city) {
    values.push(filters.city);
    conditions.push(`LOWER(city) = LOWER($${values.length})`);
  }
  if (filters.q) {
    values.push(filters.q);
    conditions.push(`(title ILIKE '%' || $${values.length} || '%'
      OR city ILIKE '%' || $${values.length} || '%'
      OR description ILIKE '%' || $${values.length} || '%')`);
  }

  return { where: conditions.length ? conditions.join(' AND ') : 'TRUE', values };
}

function toEvent(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    city: row.city,
    startsAt: row.starts_at,
    pricePaise: String(row.price_paise),
    description: row.description,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listEvents(filters) {
  const pool = getPool();
  const { where, values } = buildWhere(filters);
  const offset = (filters.page - 1) * filters.pageSize;
  const listValues = [...values, filters.pageSize, offset];
  const [eventsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, title, category, city, starts_at, price_paise, description, image_url,
              is_active, created_at, updated_at
       FROM events
       WHERE ${where}
       ORDER BY (starts_at >= NOW()) DESC,
                CASE WHEN starts_at >= NOW() THEN starts_at END ASC,
                CASE WHEN starts_at < NOW() THEN starts_at END DESC,
                id ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      listValues,
    ),
    pool.query(`SELECT COUNT(*)::BIGINT AS total FROM events WHERE ${where}`, values),
  ]);

  return {
    events: eventsResult.rows.map(toEvent),
    totalItems: Number(countResult.rows[0].total),
  };
}

async function createEvent(event) {
  const result = await getPool().query(
    `INSERT INTO events (title, category, city, starts_at, price_paise, description, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, title, category, city, starts_at, price_paise, description, image_url,
               is_active, created_at, updated_at`,
    [event.title, event.category, event.city, event.startsAt, event.pricePaise, event.description, event.imageUrl, event.isActive],
  );
  return toEvent(result.rows[0]);
}

async function updateEvent(eventId, updates) {
  const values = [];
  const assignments = [];
  for (const [key, column] of Object.entries(editableColumns)) {
    if (Object.hasOwn(updates, key)) {
      values.push(updates[key]);
      assignments.push(`${column} = $${values.length}`);
    }
  }
  if (assignments.length === 0) return getEventById(eventId);
  assignments.push('updated_at = NOW()');
  values.push(eventId);
  const result = await getPool().query(
    `UPDATE events SET ${assignments.join(', ')}
     WHERE id = $${values.length}
     RETURNING id, title, category, city, starts_at, price_paise, description, image_url,
               is_active, created_at, updated_at`,
    values,
  );
  return result.rows[0] ? toEvent(result.rows[0]) : null;
}

async function getEventById(eventId) {
  const result = await getPool().query(
    `SELECT id, title, category, city, starts_at, price_paise, description, image_url,
            is_active, created_at, updated_at
     FROM events WHERE id = $1`,
    [eventId],
  );
  return result.rows[0] ? toEvent(result.rows[0]) : null;
}

async function setEventStatus(eventId, isActive) {
  const result = await getPool().query(
    `UPDATE events SET is_active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, title, category, city, starts_at, price_paise, description, image_url,
               is_active, created_at, updated_at`,
    [eventId, isActive],
  );
  return result.rows[0] ? toEvent(result.rows[0]) : null;
}

module.exports = { createEvent, getEventById, listEvents, setEventStatus, updateEvent };
