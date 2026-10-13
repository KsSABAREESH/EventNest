const { getConfig, closeDatabase } = require('@eventnest/shared');
const { buildApp } = require('./app');

async function start() {
  const config = getConfig('auth', 4001);
  const app = buildApp();
  app.addHook('onClose', closeDatabase);
  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (error) {
    app.log.error({ err: error }, 'Auth service failed to start');
    await app.close();
    process.exitCode = 1;
  }
}

start();
