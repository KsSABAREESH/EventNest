const { createApp } = require('@eventnest/shared');

function buildApp() {
  return createApp('events-service');
}

module.exports = { buildApp };
