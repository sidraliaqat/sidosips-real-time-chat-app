import { useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';
import Loader from './Loader';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import * as messageService from '../services/messageService';

export default function ChatWindow({ onOpenInfo, onBack, mobileClass = '' }) {
  const { user } = useAuth();
  const {
    activeChat,
    messages,
    messagesLoading,
    hasMoreMessages,
    loadMoreMessages,
    typingUsers,
    activeChatId,
    deleteMessage,
  } = useChat();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searching, setSearching] = useState(false);

  if (!activeChat) {
    return (
      <div className={`chat-panel ${mobileClass}`}>
        <Loader fullPage />
      </div>
    );
  }

  async function handleSearch(query) {
    setSearchTerm(query);
    if (!query) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const { messages: results } = await messageService.getMessages(activeChatId, { search: query, limit: 50 });
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  function handleToggleSearch() {
    setSearchOpen((v) => {
      const next = !v;
      if (!next) {
        setSearchTerm('');
        setSearchResults(null);
      }
      return next;
    });
  }

  const displayedMessages = searchResults !== null ? searchResults : messages;
  const handleDeleteMessage = (messageId) => deleteMessage(messageId, activeChatId);

  return (
    <div className={`chat-panel ${mobileClass}`}>
      <ChatHeader
        chat={activeChat}
        onBack={onBack}
        onOpenInfo={onOpenInfo}
        onToggleSearch={handleToggleSearch}
        searchActive={searchOpen}
      />

      {searchOpen && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <SearchBar placeholder="Search messages in this chat..." onSearch={handleSearch} autoFocus />
        </div>
      )}

      {searchResults !== null ? (
        searching ? (
          <Loader fullPage label="Searching..." />
        ) : searchResults.length === 0 ? (
          <EmptyState title="No results" description={`No messages match "${searchTerm}".`} />
        ) : (
          <MessageList
            messages={searchResults}
            currentUserId={user.id}
            isGroup={activeChat.type === 'group'}
            recipientCount={(activeChat.participants?.length || 1) - 1}
            loading={false}
            hasMore={false}
            onLoadMore={() => {}}
            onDeleteMessage={handleDeleteMessage}
          />
        )
      ) : (
        <MessageList
          messages={displayedMessages}
          currentUserId={user.id}
          isGroup={activeChat.type === 'group'}
          recipientCount={(activeChat.participants?.length || 1) - 1}
          loading={messagesLoading}
          hasMore={hasMoreMessages}
          onLoadMore={() => loadMoreMessages(activeChatId)}
          onDeleteMessage={handleDeleteMessage}
        />
      )}

      <TypingIndicator typingUsers={typingUsers} />

      <MessageInput chatId={activeChatId} />
    </div>
  );
}
