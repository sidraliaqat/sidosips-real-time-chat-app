import { useMemo } from 'react';
import ChatItem from './ChatItem';
import Loader from './Loader';
import { useChat } from '../hooks/useChat';

export default function ChatList({ searchQuery, onSelectChat }) {
  const { chats, loadingChats, activeChatId } = useChat();

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((chat) => {
      const name = chat.type === 'group' ? chat.name : chat.otherParticipant?.name || '';
      return name.toLowerCase().includes(q);
    });
  }, [chats, searchQuery]);

  if (loadingChats) {
    return (
      <div style={{ padding: 30 }}>
        <Loader fullPage label="Loading chats..." />
      </div>
    );
  }

  if (filteredChats.length === 0) {
    return (
      <div className="sidebar-empty">
        {searchQuery ? 'No chats match your search.' : 'No conversations yet. Start a new chat!'}
      </div>
    );
  }

  return (
    <div className="chat-list">
      {filteredChats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onClick={() => onSelectChat(chat.id)}
        />
      ))}
    </div>
  );
}
