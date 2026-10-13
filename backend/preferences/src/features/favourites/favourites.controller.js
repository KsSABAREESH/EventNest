const favouritesService = require('./favourites.service');

async function get(request, reply) {
  if (request.user.role !== 'member') return reply.code(403).send({ message: 'Favourite categories are only available to member accounts.' });
  return reply.send({ data: await favouritesService.getFavourites(request.user.sub) });
}

async function replace(request, reply) {
  if (request.user.role !== 'member') return reply.code(403).send({ message: 'Favourite categories are only available to member accounts.' });
  return reply.send({ data: await favouritesService.setFavourites(request.user.sub, request.body.categories) });
}

module.exports = { get, replace };
