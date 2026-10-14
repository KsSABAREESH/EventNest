const adminUsersModel = require('./admin-users.model');

async function getFavouriteCategories(userId) {
  const categories = await adminUsersModel.findMemberFavouriteCategories(userId);
  if (!categories) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }
  return categories;
}

module.exports = { getFavouriteCategories };
