import UserAvatar from './UserAvatar';
import OnlineIndicator from './OnlineIndicator';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';

export default function ChatHeader({ chat, onBack, onOpenInfo, onToggleSearch, searchActive }) {
  const { onlineUserIds } = useChat();
  const { user } = useAuth();

  const isGroup = chat.type === 'group';
  const otherParticipant = !isGroup
    ? chat.participants?.find((p) => p.id !== user.id)
    : null;

  const isOtherOnline = otherParticipant ? onlineUserIds.has(otherParticipant.id) : false;
  const onlineMemberCount = isGroup
    ? chat.participants?.filter((p) => onlineUserIds.has(p.id)).length || 0
    : 0;

  const displayName = isGroup ? chat.name : otherParticipant?.name || 'Unknown user';
  const displayImage = isGroup ? chat.image : otherParticipant?.profileImage;

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <button className="btn-icon back-btn" onClick={onBack} aria-label="Back to chat list">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <UserAvatar
          name={displayName}
          image={displayImage}
          size={42}
          isOnline={!isGroup ? isOtherOnline : undefined}
          collageMembers={isGroup ? chat.participants : undefined}
        />

        <div className="chat-header-info">
          <div className="chat-header-name">{displayName}</div>
          <div className="chat-header-status">
            {isGroup ? (
              <>
                {chat.participants?.length || 0} members
                {onlineMemberCount > 0 && ` · ${onlineMemberCount} online`}
              </>
            ) : (
              <OnlineIndicator isOnline={isOtherOnline} lastSeen={otherParticipant?.lastSeen} />
            )}
          </div>
        </div>
      </div>

      <div className="chat-header-actions">
        <button
          className={`btn-icon ${searchActive ? 'active' : ''}`}
          onClick={onToggleSearch}
          aria-label="Search messages in this chat"
          style={searchActive ? { background: 'var(--color-mimi-pink)' } : undefined}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button className="btn-icon" onClick={onOpenInfo} aria-label="Chat information">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
