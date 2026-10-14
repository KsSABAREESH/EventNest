const { createApp, loadEnvironment, registerAuthGuards } = require('@eventnest/shared');
const jwt = require('@fastify/jwt');
const rateLimit = require('@fastify/rate-limit');
const registerAuthRoutes = require('./features/auth/auth.route');
const registerAdminRoutes = require('./features/admin/admin.route');

function buildApp() {
  loadEnvironment();
  const jwtSecret = process.env.JWT_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.startsWith('replace-with-')) {
    throw new Error('JWT_SECRET must be configured with at least 32 random characters.');
  }
  if (!adminEmail || !adminPassword || adminPassword.length < 12 || adminPassword.startsWith('change-this-')) {
    throw new Error('ADMIN_EMAIL and a strong ADMIN_PASSWORD must be configured.');
  }

  const app = createApp('auth-service');
  app.register(jwt, {
    secret: jwtSecret,
    sign: { expiresIn: 60 * 60, iss: 'eventnest' },
    verify: { allowedIss: 'eventnest' },
  });
  app.register(rateLimit, { global: false });
  registerAuthGuards(app);
  app.register(registerAuthRoutes, { prefix: '/auth' });
  app.register(registerAdminRoutes, { prefix: '/auth/admin' });
  return app;
}

module.exports = { buildApp };
