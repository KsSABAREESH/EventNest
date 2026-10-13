const { createApp } = require('@eventnest/shared');

function buildApp() {
  return createApp('preferences-service');
}

module.exports = { buildApp };
