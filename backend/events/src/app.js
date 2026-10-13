const { createApp } = require('@eventnest/shared');
const registerEventRoutes = require('./features/events/events.route');

function buildApp() {
  const app = createApp('events-service');
  app.register(registerEventRoutes, { prefix: '/events' });
  return app;
}

module.exports = { buildApp };
