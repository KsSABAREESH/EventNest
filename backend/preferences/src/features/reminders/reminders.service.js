const remindersModel = require('./reminders.model');

async function listReminders(userId) {
  const events = await remindersModel.listForUser(userId);
  return {
    ids: events.map((event) => event.id),
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      city: event.city,
      startsAt: event.starts_at,
      pricePaise: event.price_paise,
      description: event.description,
      imageUrl: event.image_url,
    })),
  };
}

async function setReminder(userId, eventId) {
  const saved = await remindersModel.createForUser(userId, eventId);
  if (!saved) {
    const error = new Error('This event is no longer available for reminders.');
    error.statusCode = 404;
    throw error;
  }
}

async function removeReminder(userId, eventId) {
  await remindersModel.deleteForUser(userId, eventId);
}

module.exports = { listReminders, removeReminder, setReminder };
