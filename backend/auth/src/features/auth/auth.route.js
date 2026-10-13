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

const profileSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['username'],
  properties: {
    username: { type: 'string', minLength: 2, maxLength: 40 },
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
  app.patch(
    '/me/profile',
    {
      preHandler: app.authenticate,
      schema: { body: profileSchema },
    },
    authController.updateProfile,
  );
}

module.exports = registerAuthRoutes;
