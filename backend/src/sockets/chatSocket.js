const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');
const chatRepository = require('../repositories/chatRepository');
const messageService = require('../services/messageService');
const notificationService = require('../services/notificationService');
const presenceService = require('../services/presenceService');
const logger = require('../utils/logger');
const { NOTIFICATION_TYPES } = require('../constants/messageTypes');

// chatId -> Map(userId -> userName) of people currently typing in that chat
const typingByChat = new Map();

/**
 * Socket.IO authentication middleware.
 * Runs once per connection attempt, before any events are accepted.
 */
function socketAuthMiddleware(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || '').replace('Bearer ', '');

    if (!token) {
      return next(new Error('AUTH_REQUIRED: No token provided'));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const reason = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      return next(new Error(reason));
    }

    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('AUTH_ERROR'));
  }
}

function registerChatSocket(io) {
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    const user = await userRepository.findById(userId);
    if (!user) {
      socket.emit('error', { message: 'Account no longer exists.' });
      socket.disconnect(true);
      return;
    }

    logger.info(`Socket connected: user ${userId} (${user.name}) — socket ${socket.id}`);

    // Every user gets a personal room for direct server->user pushes (notifications etc).
    socket.join(`user:${userId}`);

    const justCameOnline = await presenceService.addConnection(userId, socket.id);
    if (justCameOnline) {
      socket.broadcast.emit('user_online', { userId: Number(userId) });
    }

    // ---- join_chat / leave_chat -------------------------------------------------
    socket.on('join_chat', async ({ chatId }, callback) => {
      try {
        const isMember = await chatRepository.isParticipant(chatId, userId);
        if (!isMember) {
          return callback?.({ success: false, message: 'You are not a member of this chat.' });
        }
        socket.join(`chat:${chatId}`);

        // Anything the recipient hadn't seen becomes "delivered" the moment they open the app/chat.
        const deliveredIds = await messageService.markDelivered(chatId, userId);
        if (deliveredIds.length > 0) {
          io.to(`chat:${chatId}`).emit('message_delivered', { chatId: Number(chatId), messageIds: deliveredIds });
        }

        callback?.({ success: true });
      } catch (err) {
        logger.error('join_chat error', err);
        callback?.({ success: false, message: 'Could not join chat.' });
      }
    });

    socket.on('leave_chat', ({ chatId }) => {
      socket.leave(`chat:${chatId}`);
    });

    // ---- send_message -------------------------------------------------------------
    socket.on('send_message', async (payload, callback) => {
      try {
        const { chatId, content, messageType, fileUrl, fileName } = payload || {};

        const message = await messageService.sendMessage(userId, {
          chatId,
          content,
          messageType: messageType || 'text',
          fileUrl,
          fileName,
        });

        io.to(`chat:${chatId}`).emit('new_message', { message });

        const participants = await chatRepository.getParticipants(chatId);
        for (const participant of participants) {
          if (Number(participant.id) === Number(userId)) continue;

          const notification = await notificationService.createNotification({
            userId: participant.id,
            senderId: userId,
            chatId,
            messageId: message.id,
            type: NOTIFICATION_TYPES.NEW_MESSAGE,
            content: message.messageType === 'text' ? message.content : `Sent a ${message.messageType}`,
          });

          io.to(`user:${participant.id}`).emit('notification', notification);

          // If the recipient is online (even if not currently viewing this chat),
          // the message is considered delivered right away.
          if (presenceService.isOnline(participant.id)) {
            const deliveredIds = await messageService.markDelivered(chatId, participant.id);
            if (deliveredIds.length > 0) {
              io.to(`chat:${chatId}`).emit('message_delivered', {
                chatId: Number(chatId),
                messageIds: deliveredIds,
              });
            }
          }
        }

        callback?.({ success: true, message });
      } catch (err) {
        logger.error('send_message error', err);
        callback?.({ success: false, message: err.message || 'Could not send message.' });
      }
    });

    // ---- typing indicators ---------------------------------------------------------
    socket.on('typing', ({ chatId }) => {
      if (!chatId) return;
      const chatTyping = typingByChat.get(String(chatId)) || new Map();
      chatTyping.set(String(userId), user.name);
      typingByChat.set(String(chatId), chatTyping);

      socket.to(`chat:${chatId}`).emit('typing', {
        chatId: Number(chatId),
        userId: Number(userId),
        userName: user.name,
      });
    });

    socket.on('stop_typing', ({ chatId }) => {
      if (!chatId) return;
      const chatTyping = typingByChat.get(String(chatId));
      if (chatTyping) {
        chatTyping.delete(String(userId));
      }

      socket.to(`chat:${chatId}`).emit('stop_typing', {
        chatId: Number(chatId),
        userId: Number(userId),
      });
    });

    // ---- read receipts ---------------------------------------------------------------
    socket.on('message_read', async ({ chatId }, callback) => {
      try {
        const { messageIds, fullyReadIds } = await messageService.markRead(chatId, userId);

        // Bump the "seen by X/Y" count for every message that got a new read receipt,
        // even if it isn't fully read by the whole group yet.
        if (messageIds.length > 0) {
          io.to(`chat:${chatId}`).emit('message_seen_update', {
            chatId: Number(chatId),
            userId: Number(userId),
            messageIds,
          });
        }

        // Only flip the tick to "read" for messages the WHOLE chat has now seen.
        if (fullyReadIds.length > 0) {
          io.to(`chat:${chatId}`).emit('message_read', {
            chatId: Number(chatId),
            userId: Number(userId),
            messageIds: fullyReadIds,
          });
        }

        callback?.({ success: true, messageIds, fullyReadIds });
      } catch (err) {
        logger.error('message_read error', err);
        callback?.({ success: false, message: err.message || 'Could not mark messages as read.' });
      }
    });

    // ---- disconnect --------------------------------------------------------------------
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: user ${userId} — socket ${socket.id}`);

      // Clean up any typing state this user left behind.
      for (const [chatId, chatTyping] of typingByChat.entries()) {
        if (chatTyping.has(String(userId))) {
          chatTyping.delete(String(userId));
          socket.to(`chat:${chatId}`).emit('stop_typing', { chatId: Number(chatId), userId: Number(userId) });
        }
      }

      const wentOffline = await presenceService.removeConnection(userId, socket.id);
      if (wentOffline) {
        const updated = await userRepository.findById(userId);
        socket.broadcast.emit('user_offline', {
          userId: Number(userId),
          lastSeen: updated?.last_seen,
        });
      }
    });
  });
}

module.exports = { registerChatSocket };
