const remindersService = require('./reminders.service');

function ensureMember(request, reply) {
  if (request.user.role !== 'member') {
    reply.code(403).send({ message: 'Reminders are only available to member accounts.' });
    return false;
  }
  return true;
}

async function list(request, reply) {
  if (!ensureMember(request, reply)) return;
  const reminders = await remindersService.listReminders(request.user.sub);
  return reply.send({ data: reminders.ids, events: reminders.events });
}

async function create(request, reply) {
  if (!ensureMember(request, reply)) return;
  await remindersService.setReminder(request.user.sub, request.params.eventId);
  return reply.code(200).send({ reminded: true });
}

async function remove(request, reply) {
  if (!ensureMember(request, reply)) return;
  await remindersService.removeReminder(request.user.sub, request.params.eventId);
  return reply.send({ reminded: false });
}

module.exports = { create, list, remove };
