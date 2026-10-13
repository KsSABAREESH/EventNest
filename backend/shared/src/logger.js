const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'cookie', 'secret'];

function createLoggerOptions(serviceName, level = process.env.LOG_LEVEL ?? 'info') {
  return {
    level,
    base: { service: serviceName },
    redact: {
      paths: SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`, `*.*.${key}`]),
      censor: '[REDACTED]',
    },
  };
}

module.exports = { createLoggerOptions };
