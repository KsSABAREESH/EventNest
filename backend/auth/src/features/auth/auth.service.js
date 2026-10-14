const { randomBytes, scrypt: scryptCallback, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const authModel = require('./auth.model');

const scrypt = promisify(scryptCallback);
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function httpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  });
  return ['scrypt', SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION, salt.toString('hex'), key.toString('hex')].join('$');
}

async function verifyPassword(password, encodedHash) {
  const [algorithm, cost, blockSize, parallelization, saltHex, keyHex, extra] = encodedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    Number(cost) !== SCRYPT_COST ||
    Number(blockSize) !== SCRYPT_BLOCK_SIZE ||
    Number(parallelization) !== SCRYPT_PARALLELIZATION ||
    extra !== undefined ||
    !/^[a-f0-9]{32}$/i.test(saltHex ?? '') ||
    !/^[a-f0-9]{128}$/i.test(keyHex ?? '')
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(keyHex, 'hex');
  const actualKey = await scrypt(password, salt, expectedKey.length, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(expectedKey, actualKey);
}

function constantTimeStringEqual(candidate, expected) {
  const candidateDigest = createHash('sha256').update(candidate).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username ?? null,
    profileComplete: Boolean(user.username),
  };
}

async function signup({ email: rawEmail, password }) {
  const email = normalizeEmail(rawEmail);
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && email === adminEmail) {
    throw httpError(409, 'This email address is unavailable.', 'EMAIL_UNAVAILABLE');
  }

  const passwordHash = await hashPassword(password);
  try {
    const user = await authModel.createUser({ email, passwordHash });
    return toPublicUser(user);
  } catch (error) {
    if (error.code === '23505') {
      throw httpError(409, 'An account with this email already exists.', 'EMAIL_ALREADY_REGISTERED');
    }
    throw error;
  }
}

async function login({ email: rawEmail, password }) {
  const email = normalizeEmail(rawEmail);
  const user = await authModel.findUserByEmail(email);
  const passwordValid = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${'0'.repeat(SALT_LENGTH * 2)}$${'0'.repeat(KEY_LENGTH * 2)}`);

  if (!user || !passwordValid) {
    throw httpError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
  }

  return toPublicUser(user);
}

async function loginAdmin({ email: rawEmail, password }) {
  const email = normalizeEmail(rawEmail);
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? '';
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  const emailMatches = constantTimeStringEqual(email, adminEmail);
  const passwordMatches = constantTimeStringEqual(password, adminPassword);

  if (!emailMatches || !passwordMatches || !adminEmail || !adminPassword) {
    throw httpError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
  }
  return {
    id: 'admin',
    email: adminEmail,
    role: 'admin',
    username: 'Admin',
    profileComplete: true,
  };
}

async function getProfile({ id, email, role }) {
  if (role === 'admin' && id === 'admin') {
    return { id, email, role, username: 'Admin', profileComplete: true };
  }

  const user = await authModel.findUserById(id);
  if (!user) throw httpError(401, 'Your account could not be found. Please sign in again.', 'ACCOUNT_NOT_FOUND');
  return toPublicUser(user);
}

async function updateProfile({ id, role }, { username: rawUsername }) {
  if (role !== 'member') {
    throw httpError(403, 'This profile cannot be updated.', 'PROFILE_UPDATE_FORBIDDEN');
  }

  const username = rawUsername.trim();
  if (username.length < 2 || username.length > 40) {
    throw httpError(400, 'Username must be between 2 and 40 characters.', 'INVALID_USERNAME');
  }

  const user = await authModel.updateUserProfile({ id, username });
  if (!user) throw httpError(401, 'Your account could not be found. Please sign in again.', 'ACCOUNT_NOT_FOUND');
  return toPublicUser(user);
}

module.exports = { getProfile, login, loginAdmin, signup, updateProfile };
