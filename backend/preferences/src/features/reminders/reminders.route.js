const remindersController = require('./reminders.controller');

async function registerReminderRoutes(app) {
  const eventParams = {
    type: 'object', additionalProperties: false, required: ['eventId'],
    properties: { eventId: { type: 'string', format: 'uuid' } },
  };
  app.get('/', { preHandler: app.authenticateMember }, remindersController.list);
  app.put('/:eventId', {
    preHandler: app.authenticateMember,
    schema: { params: eventParams },
  }, remindersController.create);
  app.delete('/:eventId', {
    preHandler: app.authenticateMember,
    schema: { params: eventParams },
  }, remindersController.remove);
}

module.exports = registerReminderRoutes;
