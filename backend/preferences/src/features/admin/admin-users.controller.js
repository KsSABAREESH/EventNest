const adminUsersService = require('./admin-users.service');

async function getFavouriteCategories(request) {
  const categories = await adminUsersService.getFavouriteCategories(request.params.userId);
  return { data: { userId: request.params.userId, categories } };
}

module.exports = { getFavouriteCategories };
