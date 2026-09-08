const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({ url: redisUrl });

let isReady = false;

redisClient.on('error', (err) => {
  isReady = false;
  logger.error(
    `Redis connection error (${redisUrl}). ` +
      'Make sure Redis is installed and running — see README.md "Redis setup". ' +
      `Details: ${err.message}`
  );
});

redisClient.on('connect', () => {
  logger.info('Redis: connecting...');
});

redisClient.on('ready', () => {
  isReady = true;
  logger.info('Redis: connected and ready');
});

redisClient.on('end', () => {
  isReady = false;
});

/**
 * Connect to Redis. The app is allowed to start even if this fails,
 * but presence/online-tracking features degrade gracefully to
 * in-memory-only mode with a warning — nothing fails silently.
 */
async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error(
      `Could not connect to Redis at ${redisUrl}. Online presence and ` +
        'notification pub/sub will run in a limited, single-process mode. ' +
        'Start Redis and restart the server to enable full functionality.'
    );
  }
}

function isRedisReady() {
  return isReady;
}

module.exports = { redisClient, connectRedis, isRedisReady };
