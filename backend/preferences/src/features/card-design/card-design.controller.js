const cardDesignService = require('./card-design.service');

async function get(request, reply) {
  if (request.user.role !== 'member') {
    return reply.code(403).send({ message: 'Card designs are only available to member accounts.' });
  }
  const design = await cardDesignService.getDesign(request.user.sub, request.params.eventId);
  return reply.send({ data: design });
}

async function list(request, reply) {
  if (request.user.role !== 'member') {
    return reply.code(403).send({ message: 'Card designs are only available to member accounts.' });
  }
  const designs = await cardDesignService.listDesigns(request.user.sub, request.query.eventIds);
  return reply.send({ data: designs });
}

async function save(request, reply) {
  if (request.user.role !== 'member') {
    return reply.code(403).send({ message: 'Card designs are only available to member accounts.' });
  }
  const design = await cardDesignService.saveDesign(request.user.sub, request.params.eventId, request.body);
  return reply.send({ data: design });
}

module.exports = { get, list, save };
