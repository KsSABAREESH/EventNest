const adminController = require('./admin.controller');

const credentialsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email', minLength: 3, maxLength: 254 },
    password: { type: 'string', minLength: 8, maxLength: 128 },
  },
};

const userIdParams = {
  type: 'object',
  additionalProperties: false,
  required: ['userId'],
  properties: { userId: { type: 'string', format: 'uuid' } },
};

async function registerAdminRoutes(app) {
  app.post('/login', {
    schema: { body: credentialsSchema },
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, adminController.login);
  app.get('/me', { preHandler: app.authenticateAdmin }, adminController.me);
  app.get('/users', {
    preHandler: app.authenticateAdmin,
    schema: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          search: { type: 'string', minLength: 1, maxLength: 120, pattern: '\\S' },
          page: { type: 'integer', minimum: 1, maximum: 1_000_000, default: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
      },
    },
  }, adminController.listMembers);
  app.get('/users/:userId', {
    preHandler: app.authenticateAdmin,
    schema: { params: userIdParams },
  }, adminController.getMember);
}

module.exports = registerAdminRoutes;
