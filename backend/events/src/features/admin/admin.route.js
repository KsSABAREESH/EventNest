const adminController = require('./admin.controller');

const categories = ['Music', 'Workshop', 'Food', 'Sports', 'Kids'];
const eventIdParams = {
  type: 'object',
  additionalProperties: false,
  required: ['eventId'],
  properties: { eventId: { type: 'string', format: 'uuid' } },
};

const eventProperties = {
  title: { type: 'string', minLength: 3, maxLength: 160, pattern: '\\S' },
  category: { type: 'string', enum: categories },
  city: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
  startsAt: { type: 'string', format: 'date-time' },
  pricePaise: { type: 'string', maxLength: 19, pattern: '^(0|[1-9][0-9]{0,18})$' },
  description: { type: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
  imageUrl: { type: 'string', minLength: 8, maxLength: 2048, pattern: '^https?://' },
};

const createEventSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'category', 'city', 'startsAt', 'pricePaise', 'description', 'imageUrl'],
  properties: { ...eventProperties, isActive: { type: 'boolean', default: true } },
};

const updateEventSchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: eventProperties,
};

async function registerAdminRoutes(app) {
  app.get('/events', {
    preHandler: app.authenticateAdmin,
    schema: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string', enum: categories },
          city: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
          q: { type: 'string', minLength: 1, maxLength: 120, pattern: '\\S' },
          status: { type: 'string', enum: ['all', 'active', 'inactive'], default: 'all' },
          page: { type: 'integer', minimum: 1, maximum: 1_000_000, default: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 50, default: 12 },
        },
      },
    },
  }, adminController.list);

  app.post('/events', {
    preHandler: app.authenticateAdmin,
    schema: { body: createEventSchema },
  }, adminController.create);

  app.patch('/events/:eventId', {
    preHandler: app.authenticateAdmin,
    schema: { params: eventIdParams, body: updateEventSchema },
  }, adminController.update);

  app.patch('/events/:eventId/status', {
    preHandler: app.authenticateAdmin,
    schema: {
      params: eventIdParams,
      body: {
        type: 'object', additionalProperties: false, required: ['isActive'],
        properties: { isActive: { type: 'boolean' } },
      },
    },
  }, adminController.setStatus);
}

module.exports = registerAdminRoutes;
