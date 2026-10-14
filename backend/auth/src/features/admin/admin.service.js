const authService = require('../auth/auth.service');
const adminModel = require('./admin.model');

function httpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

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

async function listMembers(query) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const search = query.search?.trim();
  const { users, totalItems } = await adminModel.listMembers({ search, page, pageSize });
  return {
    data: users.map((user) => ({ id: user.id, email: user.email, role: user.role, username: user.username, createdAt: user.created_at })),
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
}

async function getMember(userId) {
  const user = await adminModel.findMemberById(userId);
  if (!user) throw httpError(404, 'User account not found.', 'USER_NOT_FOUND');
  return { id: user.id, email: user.email, role: user.role, username: user.username, createdAt: user.created_at, updatedAt: user.updated_at };
}

module.exports = { getMember, getProfile, listMembers, login };
