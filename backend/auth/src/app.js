const { createApp } = require('@eventnest/shared');

function buildApp() {
  return createApp('auth-service');
}

module.exports = { buildApp };
