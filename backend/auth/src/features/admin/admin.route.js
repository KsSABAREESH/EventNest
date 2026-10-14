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

async function registerAdminRoutes(app) {
  app.post('/login', {
    schema: { body: credentialsSchema },
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, adminController.login);
  app.get('/me', { preHandler: app.authenticateAdmin }, adminController.me);
}

module.exports = registerAdminRoutes;
