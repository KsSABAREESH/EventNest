const favouritesModel = require('./favourites.model');

const allowedCategories = ['Music', 'Workshop', 'Food', 'Sports', 'Kids'];

async function getFavourites(userId) {
  return favouritesModel.getCategories(userId);
}

async function setFavourites(userId, categories) {
  const uniqueCategories = [...new Set(categories)];
  if (!uniqueCategories.length) {
    const error = new Error('Choose at least one favourite category.');
    error.statusCode = 400;
    throw error;
  }
  if (uniqueCategories.some((category) => !allowedCategories.includes(category))) {
    const error = new Error('One or more categories are invalid.');
    error.statusCode = 400;
    throw error;
  }
  return favouritesModel.replaceCategories(userId, uniqueCategories);
}

module.exports = { getFavourites, setFavourites, allowedCategories };
