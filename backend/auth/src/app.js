const { createApp } = require('@eventnest/shared');
const registerAuthRoutes = require('./features/auth/auth.route');

function buildApp() {
  const app = createApp('auth-service');
  app.register(registerAuthRoutes, { prefix: '/auth' });
  return app;
}

module.exports = { buildApp };
