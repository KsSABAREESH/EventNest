const adminService = require('./admin.service');

async function list(request) {
  return adminService.listEvents(request.query);
}

async function create(request, reply) {
  const event = await adminService.createEvent(request.body);
  return reply.code(201).send({ data: event });
}

async function update(request) {
  const event = await adminService.updateEvent(request.params.eventId, request.body);
  return { data: event };
}

async function setStatus(request) {
  const event = await adminService.setEventStatus(request.params.eventId, request.body.isActive);
  return { data: event };
}

module.exports = { create, list, setStatus, update };
