import { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import ChatList from './ChatList';
import NewChatModal from './NewChatModal';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ onSelectChat, hideOnMobile }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);

  return (
    <div className={`sidebar ${hideOnMobile ? 'hide-mobile' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">s</span>
          <span className="sidebar-brand-name">sidosips</span>
        </div>
        <div className="sidebar-actions">
          <NotificationBell onDark onNavigateToChat={onSelectChat} />
          <button className="btn-icon on-dark" onClick={() => setNewChatOpen(true)} aria-label="Start a new chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="16" y1="11" x2="22" y2="11" />
            </svg>
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <SearchBar placeholder="Search chats..." onSearch={setSearchQuery} />
      </div>

      <ChatList searchQuery={searchQuery} onSelectChat={onSelectChat} />

      <Link to="/profile" className="sidebar-footer" style={{ textDecoration: 'none' }}>
        <UserAvatar name={user.name} image={user.profileImage} size={40} />
        <div style={{ minWidth: 0 }}>
          <div className="sidebar-footer-name">{user.name}</div>
          <div className="sidebar-footer-status">View profile</div>
        </div>
      </Link>

      <NewChatModal
        isOpen={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onChatOpened={onSelectChat}
      />
    </div>
  );
}
