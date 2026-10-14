const myFeedController = require('./my-feed.controller');

const browseQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'string', enum: ['Music', 'Workshop', 'Food', 'Sports', 'Kids'] },
    city: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
    q: { type: 'string', minLength: 1, maxLength: 120, pattern: '\\S' },
    page: { type: 'integer', minimum: 1, maximum: 1_000_000, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 50, default: 12 },
  },
};

async function registerMyFeedRoutes(app) {
  app.get('/', {
    preHandler: app.authenticateMember,
    schema: { querystring: browseQuerySchema },
  }, myFeedController.browse);
}

module.exports = registerMyFeedRoutes;
