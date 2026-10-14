const favouritesController = require('./favourites.controller');
const { allowedCategories } = require('./favourites.service');

async function registerFavouriteRoutes(app) {
  app.get('/', { preHandler: app.authenticateMember }, favouritesController.get);
  app.put('/', {
    preHandler: app.authenticateMember,
    schema: {
      body: {
        type: 'object', additionalProperties: false, required: ['categories'],
        properties: { categories: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string', enum: allowedCategories } } },
      },
    },
  }, favouritesController.replace);
}

module.exports = registerFavouriteRoutes;
