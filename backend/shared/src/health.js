const { checkDatabase } = require('./database');

async function registerHealthRoutes(app, serviceName) {
  app.get('/health', {
    schema: { response: { 200: { type: 'object', properties: {
      status: { type: 'string' }, service: { type: 'string' }, timestamp: { type: 'string' },
    } } } },
  }, async () => ({ status: 'ok', service: serviceName, timestamp: new Date().toISOString() }));

  app.get('/ready', async (_request, reply) => {
    try {
      await checkDatabase();
      return { status: 'ready', service: serviceName };
    } catch (error) {
      app.log.error({ err: error }, 'Readiness check failed');
      return reply.code(503).send({ status: 'not_ready', service: serviceName });
    }
  });
}

module.exports = { registerHealthRoutes };
