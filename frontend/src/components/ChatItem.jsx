import UserAvatar from './UserAvatar';
import { formatChatListTime } from '../utils/formatDate';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';

function previewText(chat) {
  if (!chat.lastMessage) return 'No messages yet — say hello!';
  const { messageType, content, senderId } = chat.lastMessage;
  const prefix = ''; // sender attribution kept minimal for group brevity
  if (messageType === 'image') return `${prefix}📷 Photo`;
  if (messageType === 'file') return `${prefix}📎 File`;
  return `${prefix}${content}`;
}

export default function ChatItem({ chat, isActive, onClick }) {
  const { onlineUserIds } = useChat();
  const { user } = useAuth();

  const isGroup = chat.type === 'group';
  const displayName = isGroup ? chat.name : chat.otherParticipant?.name || 'Unknown user';
  const displayImage = isGroup ? chat.image : chat.otherParticipant?.profileImage;
  const isOnline = !isGroup && chat.otherParticipant ? onlineUserIds.has(chat.otherParticipant.id) : false;
  const time = chat.lastMessage ? chat.lastMessage.createdAt : chat.createdAt;

  return (
    <button className={`chat-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <UserAvatar name={displayName} image={displayImage} size={48} isOnline={!isGroup ? isOnline : undefined} onDark />

      <div className="chat-item-body">
        <div className="chat-item-top">
          <span className="chat-item-name">{displayName}</span>
          <span className="chat-item-time">{formatChatListTime(time)}</span>
        </div>
        <div className="chat-item-bottom">
          <span className="chat-item-preview">{previewText(chat)}</span>
          {chat.unreadCount > 0 && <span className="badge">{chat.unreadCount}</span>}
        </div>
      </div>
    </button>
  );
}
