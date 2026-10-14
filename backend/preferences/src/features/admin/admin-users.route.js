const adminUsersController = require('./admin-users.controller');

const paramsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['userId'],
  properties: { userId: { type: 'string', format: 'uuid' } },
};

async function registerAdminUserRoutes(app) {
  app.get('/:userId/favourites', {
    preHandler: app.authenticateAdmin,
    schema: { params: paramsSchema },
  }, adminUsersController.getFavouriteCategories);
}

module.exports = registerAdminUserRoutes;
