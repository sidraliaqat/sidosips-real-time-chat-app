const messageService = require('../services/messageService');
const notificationService = require('../services/notificationService');
const chatRepository = require('../repositories/chatRepository');
const presenceService = require('../services/presenceService');
const { AppError } = require('../middleware/errorMiddleware');
const { NOTIFICATION_TYPES } = require('../constants/messageTypes');

async function getMessages(req, res, next) {
  try {
    const chatId = req.params.chatId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search || '';

    const result = await messageService.getChatMessages(chatId, req.user.id, { page, limit, search });
    res.status(200).json({ success: true, message: 'Messages fetched', data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Send a message over REST (useful for Postman testing / non-socket clients).
 * The primary real-time path is the Socket.IO `send_message` event, but this
 * endpoint performs the exact same validated flow and also emits over sockets
 * so both paths stay perfectly in sync.
 */
async function sendMessage(req, res, next) {
  try {
    const { chatId, content, messageType, fileUrl, fileName } = req.body;
    const message = await messageService.sendMessage(req.user.id, {
      chatId,
      content,
      messageType: messageType || 'text',
      fileUrl,
      fileName,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('new_message', { message });
    }

    // Fan out notifications + delivery status to other participants.
    const participants = await chatRepository.getParticipants(chatId);
    for (const participant of participants) {
      if (Number(participant.id) === Number(req.user.id)) continue;

      await notificationService.createNotification({
        userId: participant.id,
        senderId: req.user.id,
        chatId,
        messageId: message.id,
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        content: message.messageType === 'text' ? message.content : `Sent a ${message.messageType}`,
      });

      if (io && presenceService.isOnline(participant.id)) {
        io.to(`user:${participant.id}`).emit('notification', {
          type: NOTIFICATION_TYPES.NEW_MESSAGE,
          chatId,
          message,
        });
      }
    }

    res.status(201).json({ success: true, message: 'Message sent', data: { message } });
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const message = await messageService.deleteMessage(req.params.id, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat_id}`).emit('message_deleted', { messageId: message.id, chatId: message.chat_id });
    }

    res.status(200).json({ success: true, message: 'Message deleted', data: {} });
  } catch (err) {
    next(err);
  }
}

async function clearChat(req, res, next) {
  try {
    await messageService.clearChat(req.params.chatId, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${req.params.chatId}`).emit('chat_cleared', { chatId: Number(req.params.chatId) });
    }

    res.status(200).json({ success: true, message: 'Chat cleared', data: {} });
  } catch (err) {
    next(err);
  }
}

async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('No file was uploaded, or the file type/size was rejected.', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith('image/');

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileUrl,
        fileName: req.file.originalname,
        messageType: isImage ? 'image' : 'file',
        size: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMessageInfo(req, res, next) {
  try {
    const info = await messageService.getMessageInfo(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Message info fetched', data: info });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMessages, sendMessage, deleteMessage, uploadFile, clearChat, getMessageInfo };
