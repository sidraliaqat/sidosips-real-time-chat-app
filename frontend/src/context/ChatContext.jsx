import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastContext';
import { getSocket, connectSocket } from '../socket/socket';
import * as chatService from '../services/chatService';
import * as messageService from '../services/messageService';
import * as notificationService from '../services/notificationService';
import * as userService from '../services/userService';
import { isChatMuted } from '../utils/mutedChats';
import { getErrorMessage } from '../services/api';

export const ChatContext = createContext(null);

const TYPING_STOP_DELAY = 2500;

export function ChatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messagesByChat, setMessagesByChat] = useState({}); // { [chatId]: { items, pagination, loading } }
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingByChat, setTypingByChat] = useState({}); // { [chatId]: { [userId]: userName } }
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat' | 'info'

  const typingTimeoutRef = useRef({}); // chatId -> timeout id (for auto stop_typing)
  const activeChatIdRef = useRef(null);
  activeChatIdRef.current = activeChatId;

  // ------------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------------
  const refreshChats = useCallback(async () => {
    try {
      setLoadingChats(true);
      const result = await chatService.getChats();
      setChats(result);
    } catch (err) {
      toast.error('Could not load your chats.');
    } finally {
      setLoadingChats(false);
    }
  }, [toast]);

  const refreshNotifications = useCallback(async () => {
    try {
      const result = await notificationService.getNotifications({ limit: 20 });
      setNotifications(result.notifications);
      setUnreadNotifCount(result.unreadCount);
    } catch (err) {
      // Non-critical — fail silently in the UI, notifications aren't core flow.
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshChats();
      refreshNotifications();
    } else {
      setChats([]);
      setActiveChatId(null);
      setActiveChat(null);
      setMessagesByChat({});
      setNotifications([]);
      setUnreadNotifCount(0);
    }
  }, [isAuthenticated, refreshChats, refreshNotifications]);

  const loadMessages = useCallback(async (chatId, page = 1) => {
    setMessagesByChat((prev) => ({
      ...prev,
      [chatId]: { ...(prev[chatId] || { items: [] }), loading: true },
    }));

    try {
      const { messages, pagination } = await messageService.getMessages(chatId, { page, limit: 30 });
      setMessagesByChat((prev) => {
        const existing = prev[chatId]?.items || [];
        const merged = page === 1 ? messages : [...messages, ...existing];
        return { ...prev, [chatId]: { items: merged, pagination, loading: false } };
      });
    } catch (err) {
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: { ...(prev[chatId] || { items: [] }), loading: false },
      }));
      toast.error('Could not load messages.');
    }
  }, [toast]);

  const loadMoreMessages = useCallback(
    (chatId) => {
      const state = messagesByChat[chatId];
      if (!state || state.loading) return;
      const { currentPage, totalPages } = state.pagination || {};
      if (currentPage >= totalPages) return;
      loadMessages(chatId, currentPage + 1);
    },
    [messagesByChat, loadMessages]
  );

  const selectChat = useCallback(
    async (chatId, { mobile = false } = {}) => {
      setActiveChatId(chatId);
      if (mobile) setMobileView('chat');

      const socket = getSocket();
      socket.emit('join_chat', { chatId }, (ack) => {
        if (!ack?.success) {
          toast.error(ack?.message || 'Could not open this chat.');
        }
      });

      try {
        const chat = await chatService.getChatById(chatId);
        setActiveChat(chat);
      } catch (err) {
        toast.error('Could not load chat details.');
      }

      if (!messagesByChat[chatId]) {
        await loadMessages(chatId, 1);
      }

      // Mark everything currently unread in this chat as read.
      socket.emit('message_read', { chatId });

      // Optimistically zero-out the sidebar's unread badge for this chat.
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)));
    },
    [messagesByChat, loadMessages, toast]
  );

  const closeChat = useCallback(() => {
    setActiveChatId(null);
    setActiveChat(null);
    setMobileView('list');
  }, []);

  // ------------------------------------------------------------------
  // Sending messages / typing
  // ------------------------------------------------------------------
  const sendMessage = useCallback(
    ({ chatId, content, messageType = 'text', fileUrl, fileName }) => {
      const socket = getSocket();
      socket.emit(
        'send_message',
        { chatId, content, messageType, fileUrl, fileName },
        (ack) => {
          if (!ack?.success) {
            toast.error(ack?.message || 'Message failed to send.');
            return;
          }
          // Append immediately; the broadcast `new_message` echo is de-duplicated by id.
          setMessagesByChat((prev) => {
            const existing = prev[chatId]?.items || [];
            if (existing.some((m) => m.id === ack.message.id)) return prev;
            return {
              ...prev,
              [chatId]: { ...(prev[chatId] || {}), items: [...existing, ack.message] },
            };
          });
        }
      );

      socket.emit('stop_typing', { chatId });
      clearTimeout(typingTimeoutRef.current[chatId]);
    },
    [toast]
  );

  const notifyTyping = useCallback((chatId) => {
    const socket = getSocket();
    socket.emit('typing', { chatId });

    clearTimeout(typingTimeoutRef.current[chatId]);
    typingTimeoutRef.current[chatId] = setTimeout(() => {
      socket.emit('stop_typing', { chatId });
    }, TYPING_STOP_DELAY);
  }, []);

  const notifyStopTyping = useCallback((chatId) => {
    const socket = getSocket();
    clearTimeout(typingTimeoutRef.current[chatId]);
    socket.emit('stop_typing', { chatId });
  }, []);

  const deleteMessage = useCallback(async (messageId, chatId) => {
    try {
      await messageService.deleteMessage(messageId);
      if (chatId && messagesByChat[chatId]) {
        setMessagesByChat((prev) => ({
          ...prev,
          [chatId]: {
            ...prev[chatId],
            items: prev[chatId].items.filter((m) => m.id !== messageId),
          },
        }));
      }
      toast.success('Message deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [toast, messagesByChat]);

  // ------------------------------------------------------------------
  // Chat / group management wrappers (REST + local state sync)
  // ------------------------------------------------------------------
  const startPrivateChat = useCallback(
    async (userId) => {
      const chat = await chatService.createPrivateChat(userId);
      await refreshChats();
      return chat;
    },
    [refreshChats]
  );

  const createGroup = useCallback(
    async ({ name, image, memberIds }) => {
      const chat = await chatService.createGroupChat({ name, image, memberIds });
      await refreshChats();
      return chat;
    },
    [refreshChats]
  );

  const addMemberToActiveChat = useCallback(
    async (userId) => {
      const chat = await chatService.addMember(activeChatId, userId);
      setActiveChat(chat);
      await refreshChats();
    },
    [activeChatId, refreshChats]
  );

  const removeMemberFromActiveChat = useCallback(
    async (userId) => {
      const chat = await chatService.removeMember(activeChatId, userId);
      setActiveChat(chat);
      await refreshChats();
    },
    [activeChatId, refreshChats]
  );

  const leaveActiveGroup = useCallback(async () => {
    await chatService.leaveGroup(activeChatId);
    closeChat();
    await refreshChats();
  }, [activeChatId, closeChat, refreshChats]);

  const updateActiveGroup = useCallback(
    async ({ name, image }) => {
      const chat = await chatService.updateGroup(activeChatId, { name, image });
      setActiveChat(chat);
      await refreshChats();
    },
    [activeChatId, refreshChats]
  );

  const setContactNickname = useCallback(
    async (userId, nickname) => {
      await userService.setNickname(userId, nickname);
      await refreshChats();
      if (activeChatId) {
        const chat = await chatService.getChatById(activeChatId);
        setActiveChat(chat);
      }
    },
    [refreshChats, activeChatId]
  );

  const clearContactNickname = useCallback(
    async (userId) => {
      await userService.clearNickname(userId);
      await refreshChats();
      if (activeChatId) {
        const chat = await chatService.getChatById(activeChatId);
        setActiveChat(chat);
      }
    },
    [refreshChats, activeChatId]
  );

  const markNotifRead = useCallback(async (id) => {
    await notificationService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllNotifRead = useCallback(async () => {
    await notificationService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifCount(0);
  }, []);

  // ------------------------------------------------------------------
  // Socket event wiring (registered once per authenticated session)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;

    const socket = connectSocket();

    const onNewMessage = ({ message }) => {
      setMessagesByChat((prev) => {
        const existing = prev[message.chatId]?.items || [];
        if (existing.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          [message.chatId]: { ...(prev[message.chatId] || {}), items: [...existing, message] },
        };
      });

      setChats((prev) => {
        const isActive = activeChatIdRef.current === message.chatId;
        const isOwn = message.senderId === user.id;
        const updated = prev.map((c) =>
          c.id === message.chatId
            ? {
                ...c,
                lastMessage: {
                  content: message.content,
                  messageType: message.messageType,
                  createdAt: message.createdAt,
                  senderId: message.senderId,
                },
                unreadCount: isActive || isOwn ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        );
        // bump the chat with the new message to the top
        const idx = updated.findIndex((c) => c.id === message.chatId);
        if (idx > 0) {
          const [chat] = updated.splice(idx, 1);
          updated.unshift(chat);
        }
        return updated;
      });

      // If this message landed in the chat currently open, mark it read immediately.
      if (activeChatIdRef.current === message.chatId && message.senderId !== user.id) {
        socket.emit('message_read', { chatId: message.chatId });
      }
    };

    const onMessageDelivered = ({ chatId, messageIds }) => {
      setMessagesByChat((prev) => {
        const state = prev[chatId];
        if (!state) return prev;
        return {
          ...prev,
          [chatId]: {
            ...state,
            items: state.items.map((m) =>
              messageIds.includes(m.id) && m.status === 'sent' ? { ...m, status: 'delivered' } : m
            ),
          },
        };
      });
    };

    const onMessageRead = ({ chatId, messageIds }) => {
      setMessagesByChat((prev) => {
        const state = prev[chatId];
        if (!state) return prev;
        return {
          ...prev,
          [chatId]: {
            ...state,
            items: state.items.map((m) => (messageIds.includes(m.id) ? { ...m, status: 'read' } : m)),
          },
        };
      });
    };

    // Bumps the "Seen by X/Y" count as members read a message, even before
    // it's fully read by everyone (which is what flips the tick color, above).
    const onMessageSeenUpdate = ({ chatId, messageIds }) => {
      setMessagesByChat((prev) => {
        const state = prev[chatId];
        if (!state) return prev;
        return {
          ...prev,
          [chatId]: {
            ...state,
            items: state.items.map((m) =>
              messageIds.includes(m.id) ? { ...m, readCount: (m.readCount || 0) + 1 } : m
            ),
          },
        };
      });
    };

    const onTyping = ({ chatId, userId, userName }) => {
      if (userId === user.id) return;
      setTypingByChat((prev) => ({
        ...prev,
        [chatId]: { ...(prev[chatId] || {}), [userId]: userName },
      }));
    };

    const onStopTyping = ({ chatId, userId }) => {
      setTypingByChat((prev) => {
        if (!prev[chatId]) return prev;
        const next = { ...prev[chatId] };
        delete next[userId];
        return { ...prev, [chatId]: next };
      });
    };

    const onUserOnline = ({ userId }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    };

    const onUserOffline = ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setActiveChat((prev) => {
        if (!prev?.participants) return prev;
        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === userId ? { ...p, isOnline: false, lastSeen: new Date().toISOString() } : p
          ),
        };
      });
    };

    const onNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadNotifCount((prev) => prev + 1);
      if (notification.chatId !== activeChatIdRef.current && !isChatMuted(notification.chatId)) {
        toast.info(notification.content || 'You have a new message');
      }
      refreshChats();
    };

    const onChatUpdated = ({ chat }) => {
      setChats((prev) => {
        const exists = prev.some((c) => c.id === chat.id);
        return exists ? prev.map((c) => (c.id === chat.id ? { ...c, ...chat } : c)) : [chat, ...prev];
      });
      setActiveChat((prev) => (prev?.id === chat.id ? { ...prev, ...chat } : prev));
    };

    const onMemberLeft = ({ chatId, userId }) => {
      setActiveChat((prev) => {
        if (prev?.id !== chatId) return prev;
        return { ...prev, participants: prev.participants.filter((p) => p.id !== userId) };
      });
    };

    const onChatCleared = ({ chatId }) => {
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 }, loading: false },
      }));
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, lastMessage: null, unreadCount: 0 } : c)));
      if (chatId === activeChatIdRef.current) {
        toast.info('This chat was cleared.');
      }
    };

    const onMessageDeleted = ({ messageId, chatId }) => {
      setMessagesByChat((prev) => {
        const state = prev[chatId];
        if (!state) return prev;
        return { ...prev, [chatId]: { ...state, items: state.items.filter((m) => m.id !== messageId) } };
      });
    };

    const onConnectError = (err) => {
      if (err.message?.includes('TOKEN') || err.message?.includes('AUTH')) {
        toast.error('Your session could not be verified for real-time chat.');
      }
    };

    socket.on('new_message', onNewMessage);
    socket.on('message_delivered', onMessageDelivered);
    socket.on('message_read', onMessageRead);
    socket.on('message_seen_update', onMessageSeenUpdate);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);
    socket.on('notification', onNotification);
    socket.on('chat_updated', onChatUpdated);
    socket.on('member_left', onMemberLeft);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('chat_cleared', onChatCleared);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('message_delivered', onMessageDelivered);
      socket.off('message_read', onMessageRead);
      socket.off('message_seen_update', onMessageSeenUpdate);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
      socket.off('notification', onNotification);
      socket.off('chat_updated', onChatUpdated);
      socket.off('member_left', onMemberLeft);
      socket.off('message_deleted', onMessageDeleted);
      socket.off('chat_cleared', onChatCleared);
      socket.off('connect_error', onConnectError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const value = {
    chats,
    loadingChats,
    activeChatId,
    activeChat,
    messages: activeChatId ? messagesByChat[activeChatId]?.items || [] : [],
    messagesLoading: activeChatId ? Boolean(messagesByChat[activeChatId]?.loading) : false,
    hasMoreMessages: activeChatId
      ? (messagesByChat[activeChatId]?.pagination?.currentPage || 1) <
        (messagesByChat[activeChatId]?.pagination?.totalPages || 1)
      : false,
    onlineUserIds,
    typingUsers: activeChatId ? typingByChat[activeChatId] || {} : {},
    notifications,
    unreadNotifCount,
    mobileView,
    setMobileView,
    refreshChats,
    selectChat,
    closeChat,
    loadMoreMessages,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
    deleteMessage,
    startPrivateChat,
    createGroup,
    addMemberToActiveChat,
    removeMemberFromActiveChat,
    leaveActiveGroup,
    updateActiveGroup,
    deleteChat: chatService.deleteChat,
    markNotifRead,
    markAllNotifRead,
    refreshNotifications,
    setContactNickname,
    clearContactNickname,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
