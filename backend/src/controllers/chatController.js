const chatService = require('../services/chatService');

async function createPrivateChat(req, res, next) {
  try {
    const { userId } = req.body;
    const chat = await chatService.getOrCreatePrivateChat(req.user.id, userId);
    res.status(201).json({ success: true, message: 'Chat ready', data: { chat } });
  } catch (err) {
    next(err);
  }
}

async function createGroupChat(req, res, next) {
  try {
    const { name, image, memberIds } = req.body;
    const chat = await chatService.createGroupChat(req.user.id, { name, image, memberIds });

    // Notify each added member in real time that they were invited.
    const io = req.app.get('io');
    if (io) {
      memberIds.forEach((memberId) => {
        io.to(`user:${memberId}`).emit('notification', {
          type: 'group_invite',
          chat,
          message: `You were added to the group "${chat.name}"`,
        });
      });
    }

    res.status(201).json({ success: true, message: 'Group created successfully', data: { chat } });
  } catch (err) {
    next(err);
  }
}

async function getChats(req, res, next) {
  try {
    const chats = await chatService.getUserChats(req.user.id);
    res.status(200).json({ success: true, message: 'Chats fetched', data: { chats } });
  } catch (err) {
    next(err);
  }
}

async function getChatById(req, res, next) {
  try {
    const chat = await chatService.getChatById(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Chat fetched', data: { chat } });
  } catch (err) {
    next(err);
  }
}

async function deleteChat(req, res, next) {
  try {
    await chatService.deleteChat(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Chat deleted', data: {} });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const { userId } = req.body;
    const chat = await chatService.addMember(req.params.id, req.user.id, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chat.id}`).emit('chat_updated', { chat });
      io.to(`user:${userId}`).emit('notification', {
        type: 'group_invite',
        chat,
        message: `You were added to the group "${chat.name}"`,
      });
    }

    res.status(200).json({ success: true, message: 'Member added', data: { chat } });
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const chat = await chatService.removeMember(req.params.id, req.user.id, req.params.userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chat.id}`).emit('chat_updated', { chat });
    }

    res.status(200).json({ success: true, message: 'Member removed', data: { chat } });
  } catch (err) {
    next(err);
  }
}

async function leaveGroup(req, res, next) {
  try {
    await chatService.leaveGroup(req.params.id, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${req.params.id}`).emit('member_left', { chatId: Number(req.params.id), userId: req.user.id });
    }

    res.status(200).json({ success: true, message: 'You left the group', data: {} });
  } catch (err) {
    next(err);
  }
}

async function updateGroup(req, res, next) {
  try {
    const { name, image } = req.body;
    const chat = await chatService.updateGroup(req.params.id, req.user.id, { name, image });

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chat.id}`).emit('chat_updated', { chat });
    }

    res.status(200).json({ success: true, message: 'Group updated', data: { chat } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPrivateChat,
  createGroupChat,
  getChats,
  getChatById,
  deleteChat,
  addMember,
  removeMember,
  leaveGroup,
  updateGroup,
};
