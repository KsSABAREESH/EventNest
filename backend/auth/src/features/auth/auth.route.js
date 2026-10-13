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
  required: ['username', 'mobileNumber'],
  properties: {
    username: { type: 'string', minLength: 2, maxLength: 40 },
    mobileNumber: { type: 'string', minLength: 10, maxLength: 24, pattern: '^[+0-9 ()-]+$' },
    photoUrl: { type: 'string', maxLength: 2048, format: 'uri' },
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
