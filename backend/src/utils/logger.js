/* Minimal, dependency-free logger with consistent, timestamped output. */

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (...args) => console.log(`[INFO ${timestamp()}]`, ...args),
  warn: (...args) => console.warn(`[WARN ${timestamp()}]`, ...args),
  error: (...args) => console.error(`[ERROR ${timestamp()}]`, ...args),
};

module.exports = logger;
