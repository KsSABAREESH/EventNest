const { getPool } = require('@eventnest/shared');

async function findMemberFavouriteCategories(userId) {
  const result = await getPool().query(
    `SELECT u.id, favourites.category
     FROM users AS u
     LEFT JOIN user_favourite_categories AS favourites ON favourites.user_id = u.id
     WHERE u.id = $1 AND u.role = 'member'
     ORDER BY favourites.category`,
    [userId],
  );
  if (result.rowCount === 0) return null;
  return result.rows.flatMap((row) => row.category ? [row.category] : []);
}

module.exports = { findMemberFavouriteCategories };
