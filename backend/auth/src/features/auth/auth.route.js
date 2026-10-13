const authController = require('./auth.controller');

const credentialsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email', minLength: 3, maxLength: 254 },
    password: { type: 'string', minLength: 8, maxLength: 128 },
  },
};

async function registerAuthRoutes(app) {
  app.post(
    '/signup',
    {
      schema: { body: credentialsSchema },
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    authController.signup,
  );

  app.post(
    '/login',
    {
      schema: { body: credentialsSchema },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    authController.login,
  );

  app.get('/me', { preHandler: app.authenticate }, authController.me);
}

module.exports = registerAuthRoutes;
