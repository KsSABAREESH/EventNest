const { getPool } = require('@eventnest/shared');

async function listForUser(userId) {
  const result = await getPool().query(
    `SELECT event.id, event.title, event.category, event.city, event.starts_at,
            event.price_paise, event.description, event.image_url
     FROM event_reminders reminder
     JOIN events event ON event.id = reminder.event_id
     WHERE reminder.user_id = $1
     ORDER BY event.starts_at ASC, event.id ASC`,
    [userId],
  );
  return result.rows;
}

async function createForUser(userId, eventId) {
  const result = await getPool().query(
    `INSERT INTO event_reminders (user_id, event_id)
     SELECT $1, id FROM events
     WHERE id = $2 AND is_active = TRUE AND starts_at > NOW()
     ON CONFLICT (user_id, event_id) DO NOTHING
     RETURNING event_id`,
    [userId, eventId],
  );
  if (result.rowCount) return true;

  const existing = await getPool().query(
    `SELECT 1 FROM event_reminders reminder
     JOIN events event ON event.id = reminder.event_id
     WHERE reminder.user_id = $1 AND reminder.event_id = $2
       AND event.is_active = TRUE AND event.starts_at > NOW()`,
    [userId, eventId],
  );
  return existing.rowCount > 0;
}

async function deleteForUser(userId, eventId) {
  await getPool().query(
    'DELETE FROM event_reminders WHERE user_id = $1 AND event_id = $2',
    [userId, eventId],
  );
}

module.exports = { createForUser, deleteForUser, listForUser };
