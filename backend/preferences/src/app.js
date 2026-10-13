const { createApp } = require('@eventnest/shared');
const registerFavouriteRoutes = require('./features/favourites/favourites.route');
const registerFeedRoutes = require('./features/feed/feed.route');
const registerReminderRoutes = require('./features/reminders/reminders.route');
const registerCardDesignRoutes = require('./features/card-design/card-design.route');

function buildApp() {
  const app = createApp('preferences-service');
  app.register(registerFavouriteRoutes, { prefix: '/preferences/favourites' });
  app.register(registerFeedRoutes, { prefix: '/feed' });
  app.register(registerReminderRoutes, { prefix: '/reminders' });
  app.register(registerCardDesignRoutes, { prefix: '/events' });
  return app;
}

module.exports = { buildApp };
