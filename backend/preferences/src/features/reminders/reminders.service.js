const remindersModel = require('./reminders.model');

async function listReminders(userId) {
  return remindersModel.listForUser(userId);
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
