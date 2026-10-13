const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const { randomUUID } = require('node:crypto');
const { createLoggerOptions } = require('./logger');
const { registerHealthRoutes } = require('./health');

function createApp(serviceName, options = {}) {
  const app = Fastify({
    logger: createLoggerOptions(serviceName, options.logLevel),
    requestIdHeader: 'x-request-id',
    genReqId: (request) => request.headers['x-request-id']?.toString() ?? randomUUID(),
    trustProxy: process.env.TRUST_PROXY === 'true',
    bodyLimit: 1_048_576,
  });

  app.register(helmet);
  app.register(cors, {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'x-request-id'],
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });
  app.register(async (instance) => registerHealthRoutes(instance, serviceName));
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Request failed');
    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    return reply.code(statusCode).send({
      error: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR',
      message: statusCode === 500 ? 'An unexpected error occurred.' : error.message,
      requestId: request.id,
    });
  });
  return app;
}

module.exports = { createApp };
