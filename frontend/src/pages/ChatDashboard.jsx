import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ChatInfo from '../components/ChatInfo';
import GroupInfo from '../components/GroupInfo';
import EmptyState from '../components/EmptyState';
import { useChat } from '../hooks/useChat';

export default function ChatDashboard() {
  const { activeChat, activeChatId, selectChat, closeChat, mobileView, setMobileView } = useChat();
  const [infoOpen, setInfoOpen] = useState(false);

  function handleSelectChat(chatId) {
    setInfoOpen(false);
    selectChat(chatId, { mobile: true });
  }

  function handleOpenInfo() {
    setInfoOpen(true);
    setMobileView('info');
  }

  function handleCloseInfo() {
    setInfoOpen(false);
    setMobileView('chat');
  }

  function handleBackToList() {
    setInfoOpen(false);
    setMobileView('list');
    closeChat();
  }

  const showMobileClass = mobileView === 'chat' || mobileView === 'info' ? 'show-mobile' : '';

  return (
    <div className="app-shell">
      <Sidebar onSelectChat={handleSelectChat} hideOnMobile={mobileView !== 'list'} />

      {activeChatId ? (
        <ChatWindow onOpenInfo={handleOpenInfo} onBack={handleBackToList} mobileClass={showMobileClass} />
      ) : (
        <div className={`chat-panel ${showMobileClass}`}>
          <EmptyState
            icon={<span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>s</span>}
            title="sidosips"
            description="Select a conversation to start chatting."
          />
        </div>
      )}

      {activeChat && infoOpen && (
        activeChat.type === 'group' ? (
          <GroupInfo chat={activeChat} onClose={handleCloseInfo} />
        ) : (
          <ChatInfo chat={activeChat} onClose={handleCloseInfo} />
        )
      )}
    </div>
  );
}
