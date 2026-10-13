const eventsService = require('./events.service');

async function browse(request) {
  return eventsService.browseUpcoming(request.query);
}

module.exports = { browse };
