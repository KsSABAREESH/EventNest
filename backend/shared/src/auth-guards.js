function registerAuthGuards(app) {
  async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
      return true;
    } catch {
      reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'A valid bearer token is required.',
        requestId: request.id,
      });
      return false;
    }
  }

  app.decorate('authenticate', authenticate);
  app.decorate('authenticateAdmin', async function authenticateAdmin(request, reply) {
    if (!(await authenticate(request, reply))) return;
    if (request.user.role !== 'admin' || request.user.sub !== 'admin') {
      return reply.code(403).send({
        error: 'FORBIDDEN',
        message: 'An admin account is required.',
        requestId: request.id,
      });
    }
  });
  app.decorate('authenticateMember', async function authenticateMember(request, reply) {
    if (!(await authenticate(request, reply))) return;
    if (request.user.role !== 'member') {
      return reply.code(403).send({
        error: 'FORBIDDEN',
        message: 'A member account is required.',
        requestId: request.id,
      });
    }
  });
}

module.exports = { registerAuthGuards };
