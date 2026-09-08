import UserAvatar from './UserAvatar';
import EmptyState from './EmptyState';

function timeAgo(dateInput) {
  const diffMs = Date.now() - new Date(dateInput).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onSelect }) {
  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <strong>Notifications</strong>
        <button className="btn-ghost btn" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={onMarkAllRead}>
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        notifications.map((n) => (
          <button
            key={n.id}
            className={`notif-item ${n.isRead ? '' : 'unread'}`}
            onClick={() => {
              if (!n.isRead) onMarkRead(n.id);
              onSelect(n);
            }}
          >
            {!n.isRead && <span className="notif-item-dot" aria-hidden="true" />}
            <UserAvatar name={n.senderName || 'sidosips'} image={n.senderProfileImage} size={36} />
            <div>
              <div className="notif-item-text">
                <strong>{n.senderName || 'sidosips'}</strong>{' '}
                {n.type === 'group_invite' ? 'added you to a group' : n.content || 'sent a message'}
              </div>
              <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
