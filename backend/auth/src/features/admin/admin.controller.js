const adminService = require('./admin.service');

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

async function login(request, reply) {
  const user = await adminService.login(request.body);
  const accessToken = await reply.jwtSign({
    sub: String(user.id),
    email: user.email,
    role: user.role,
  });
  return reply.send({
    tokenType: 'Bearer',
    accessToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user,
  });
}

async function me(request) {
  const user = await adminService.getProfile(request.user);
  return { user };
}

module.exports = { login, me };
