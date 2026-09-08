import { useState, useRef, useEffect } from 'react';
import NotificationPanel from './NotificationPanel';
import { useChat } from '../hooks/useChat';

export default function NotificationBell({ onDark = false, onNavigateToChat }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const { notifications, unreadNotifCount, markNotifRead, markAllNotifRead } = useChat();

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bell-btn-wrap" ref={wrapRef}>
      <button
        className={`btn-icon ${onDark ? 'on-dark' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadNotifCount > 0 ? `, ${unreadNotifCount} unread` : ''}`}
        aria-haspopup="true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
      {unreadNotifCount > 0 && (
        <span className="bell-badge">{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</span>
      )}

      {open && (
        <NotificationPanel
          notifications={notifications}
          onMarkRead={markNotifRead}
          onMarkAllRead={markAllNotifRead}
          onSelect={(n) => {
            setOpen(false);
            if (n.chatId) onNavigateToChat(n.chatId);
          }}
        />
      )}
    </div>
  );
}
