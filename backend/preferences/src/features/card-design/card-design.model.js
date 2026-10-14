const { getPool } = require('@eventnest/shared');

async function getForUser(userId, eventId) {
  const result = await getPool().query(
    `SELECT design.theme, design.stickers
     FROM events event
     LEFT JOIN event_card_designs design
       ON design.event_id = event.id AND design.user_id = $1
     WHERE event.id = $2`,
    [userId, eventId],
  );
  if (!result.rowCount) return null;
  return {
    theme: result.rows[0].theme ?? 'paper',
    stickers: result.rows[0].stickers ?? [],
  };
}

async function listForUser(userId, eventIds) {
  if (eventIds.length === 0) return [];
  const result = await getPool().query(
    `SELECT event_id, theme, stickers
     FROM event_card_designs
     WHERE user_id = $1 AND event_id = ANY($2::UUID[])`,
    [userId, eventIds],
  );
  return result.rows.map((row) => ({
    eventId: row.event_id,
    theme: row.theme,
    stickers: row.stickers,
  }));
}

async function saveForUser(userId, eventId, theme, stickers) {
  const result = await getPool().query(
    `INSERT INTO event_card_designs (user_id, event_id, theme, stickers)
     SELECT $1, event.id, $3, $4::TEXT[]
     FROM events event
     WHERE event.id = $2
     ON CONFLICT (user_id, event_id) DO UPDATE
       SET theme = EXCLUDED.theme,
           stickers = EXCLUDED.stickers,
           updated_at = NOW()
     RETURNING theme, stickers`,
    [userId, eventId, theme, stickers],
  );
  if (!result.rowCount) return null;
  return { theme: result.rows[0].theme, stickers: result.rows[0].stickers };
}

module.exports = { getForUser, listForUser, saveForUser };
