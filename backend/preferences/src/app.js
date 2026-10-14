const { createApp, registerAuthGuards } = require('@eventnest/shared');
const jwt = require('@fastify/jwt');
const registerFavouriteRoutes = require('./features/favourites/favourites.route');
const registerFeedRoutes = require('./features/feed/feed.route');
const registerReminderRoutes = require('./features/reminders/reminders.route');
const registerCardDesignRoutes = require('./features/card-design/card-design.route');

function buildApp() {
  const app = createApp('preferences-service');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  app.register(jwt, {
    secret: process.env.JWT_SECRET,
    verify: { allowedIss: 'eventnest' },
  });
  registerAuthGuards(app);
  app.register(registerFavouriteRoutes, { prefix: '/preferences/favourites' });
  app.register(registerFeedRoutes, { prefix: '/feed' });
  app.register(registerReminderRoutes, { prefix: '/reminders' });
  app.register(registerCardDesignRoutes, { prefix: '/events' });
  return app;
}

module.exports = { buildApp };
