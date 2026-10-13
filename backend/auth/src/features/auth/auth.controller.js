const authService = require('./auth.service');

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

async function sendToken(reply, user, statusCode = 200) {
  const accessToken = await reply.jwtSign({
    sub: String(user.id),
    email: user.email,
    role: user.role,
  });
  return reply.code(statusCode).send({
    tokenType: 'Bearer',
    accessToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user,
  });
}

async function signup(request, reply) {
  const user = await authService.signup(request.body);
  return sendToken(reply, user, 201);
}

async function login(request, reply) {
  const user = await authService.login(request.body);
  return sendToken(reply, user);
}

async function me(request) {
  const user = await authService.getProfile({
    id: request.user.sub,
    email: request.user.email,
    role: request.user.role,
  });
  return { user };
}

async function updateProfile(request) {
  const user = await authService.updateProfile(
    { id: request.user.sub, role: request.user.role },
    request.body,
  );
  return { user };
}

module.exports = { login, me, signup, updateProfile };
