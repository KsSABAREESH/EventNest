const authService = require('../auth/auth.service');

async function login(credentials) {
  const user = await authService.loginAdmin(credentials);
  if (user.role !== 'admin' || user.id !== 'admin') {
    const error = new Error('Email or password is incorrect.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }
  return user;
}

async function getProfile(claims) {
  if (claims.role !== 'admin' || claims.sub !== 'admin') {
    const error = new Error('An admin account is required.');
    error.statusCode = 403;
    error.code = 'ADMIN_REQUIRED';
    throw error;
  }
  return authService.getProfile({ id: claims.sub, email: claims.email, role: claims.role });
}

module.exports = { getProfile, login };
