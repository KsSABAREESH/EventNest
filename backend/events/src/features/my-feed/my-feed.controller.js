const myFeedService = require('./my-feed.service');

async function browse(request, reply) {
  if (request.user.role !== 'member') {
    return reply.code(403).send({ message: 'My Feed is only available to member accounts.' });
  }
  return reply.send(await myFeedService.browseForUser(request.user.sub, request.query));
}

module.exports = { browse };
