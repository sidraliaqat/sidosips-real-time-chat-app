const MESSAGE_TYPES = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
});

const MESSAGE_STATUS = Object.freeze({
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
});

const NOTIFICATION_TYPES = Object.freeze({
  NEW_MESSAGE: 'new_message',
  GROUP_INVITE: 'group_invite',
  GROUP_MESSAGE: 'group_message',
  MENTION: 'mention',
});

module.exports = { MESSAGE_TYPES, MESSAGE_STATUS, NOTIFICATION_TYPES };
