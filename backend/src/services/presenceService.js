const { redisClient, isRedisReady } = require('../config/redis');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');

const ONLINE_SET_KEY = 'sidosips:online_users';

// In-memory map is the source of truth for "is this socket alive right now".
// A user can have multiple open tabs/sockets, so we track a set of socket ids per user.
const userIdToSocketIds = new Map();

function getSocketsForUser(userId) {
  return userIdToSocketIds.get(String(userId)) || new Set();
}

/**
 * Register a new socket connection for a user.
 * Returns true if this is the user's FIRST active connection (i.e. they just came online).
 */
async function addConnection(userId, socketId) {
  const key = String(userId);
  const sockets = userIdToSocketIds.get(key) || new Set();
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  userIdToSocketIds.set(key, sockets);

  if (wasOffline) {
    await userRepository.setOnlineStatus(userId, true);
    if (isRedisReady()) {
      try {
        await redisClient.sAdd(ONLINE_SET_KEY, key);
      } catch (err) {
        logger.warn('Redis sAdd failed (continuing without it):', err.message);
      }
    }
  }

  return wasOffline;
}

/**
 * Remove a socket connection. Returns true if the user has no more
 * active connections (i.e. they just went offline).
 */
async function removeConnection(userId, socketId) {
  const key = String(userId);
  const sockets = userIdToSocketIds.get(key);
  if (!sockets) return true;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userIdToSocketIds.delete(key);
    await userRepository.setOnlineStatus(userId, false);
    if (isRedisReady()) {
      try {
        await redisClient.sRem(ONLINE_SET_KEY, key);
      } catch (err) {
        logger.warn('Redis sRem failed (continuing without it):', err.message);
      }
    }
    return true;
  }

  userIdToSocketIds.set(key, sockets);
  return false;
}

function isOnline(userId) {
  return getSocketsForUser(userId).size > 0;
}

function getOnlineUserIds() {
  return Array.from(userIdToSocketIds.keys()).map(Number);
}

module.exports = {
  addConnection,
  removeConnection,
  isOnline,
  getOnlineUserIds,
  getSocketsForUser,
};
