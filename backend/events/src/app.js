const { createApp, registerAuthGuards } = require('@eventnest/shared');
const jwt = require('@fastify/jwt');
const registerEventRoutes = require('./features/events/events.route');
const registerMyFeedRoutes = require('./features/my-feed/my-feed.route');
const registerAdminRoutes = require('./features/admin/admin.route');

function buildApp() {
  const app = createApp('events-service');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  app.register(jwt, {
    secret: process.env.JWT_SECRET,
    verify: { allowedIss: 'eventnest' },
  });
  registerAuthGuards(app);
  app.register(registerEventRoutes, { prefix: '/events' });
  app.register(registerMyFeedRoutes, { prefix: '/events/my-feed' });
  app.register(registerAdminRoutes, { prefix: '/admin' });
  return app;
}

module.exports = { buildApp };
