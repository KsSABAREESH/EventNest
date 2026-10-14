const cardDesignController = require('./card-design.controller');
const { allowedThemes, allowedStickers } = require('./card-design.service');

async function registerCardDesignRoutes(app) {
  const params = {
    type: 'object', additionalProperties: false, required: ['eventId'],
    properties: { eventId: { type: 'string', format: 'uuid' } },
  };
  app.get('/card-designs', {
    preHandler: app.authenticate,
    schema: {
      querystring: {
        type: 'object', additionalProperties: false, required: ['eventIds'],
        properties: {
          eventIds: { type: 'array', minItems: 1, maxItems: 50, uniqueItems: true, items: { type: 'string', format: 'uuid' } },
        },
      },
    },
  }, cardDesignController.list);
  app.get('/:eventId/card-design', {
    preHandler: app.authenticate,
    schema: { params },
  }, cardDesignController.get);
  app.put('/:eventId/card-design', {
    preHandler: app.authenticate,
    schema: {
      params,
      body: {
        type: 'object', additionalProperties: false, required: ['theme', 'stickers'],
        properties: {
          theme: { type: 'string', enum: allowedThemes },
          stickers: { type: 'array', maxItems: 3, uniqueItems: true, items: { type: 'string', enum: allowedStickers } },
        },
      },
    },
  }, cardDesignController.save);
}

module.exports = registerCardDesignRoutes;
