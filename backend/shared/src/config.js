const path = require('node:path');
const dotenv = require('dotenv');

let loaded = false;

function loadEnvironment() {
  if (loaded) return;
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  loaded = true;
}

function getConfig(serviceName, defaultPort) {
  loadEnvironment();
  const rawPort = process.env[`${serviceName.toUpperCase()}_PORT`] ?? defaultPort;
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port configured for ${serviceName}`);
  }
  return {
    serviceName,
    port,
    host: process.env.HOST ?? '0.0.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    databaseUrl: process.env.DATABASE_URL,
    logLevel: process.env.LOG_LEVEL ?? 'info',
  };
}

module.exports = { getConfig, loadEnvironment };
