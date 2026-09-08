import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import Loader from './Loader';
import EmptyState from './EmptyState';
import { formatDateDivider } from '../utils/formatDate';

function groupWithDividers(messages) {
  const groups = [];
  let lastDateLabel = null;

  messages.forEach((message) => {
    const label = formatDateDivider(message.createdAt);
    if (label !== lastDateLabel) {
      groups.push({ type: 'divider', label, key: `divider-${message.id}` });
      lastDateLabel = label;
    }
    groups.push({ type: 'message', message, key: `msg-${message.id}` });
  });

  return groups;
}

export default function MessageList({ messages, currentUserId, isGroup, recipientCount = 0, loading, hasMore, onLoadMore, onDeleteMessage }) {
  const bottomRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = last.id;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  if (loading && messages.length === 0) {
    return <Loader fullPage label="Loading messages..." />;
  }

  if (!loading && messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="Say hello and start the conversation."
      />
    );
  }

  const items = groupWithDividers(messages);

  return (
    <div className="message-list">
      {hasMore && (
        <div className="text-center" style={{ marginBottom: 12 }}>
          <button className="btn btn-ghost" onClick={onLoadMore} disabled={loading}>
            {loading ? <Loader /> : 'Load earlier messages'}
          </button>
        </div>
      )}

      {items.map((item) => {
        if (item.type === 'divider') {
          return (
            <div className="message-date-divider" key={item.key}>
              {item.label}
            </div>
          );
        }

        const { message } = item;
        const isOwn = message.senderId === currentUserId;
        return (
          <MessageBubble
            key={item.key}
            message={message}
            isOwn={isOwn}
            showSenderName={isGroup}
            isGroup={isGroup}
            recipientCount={recipientCount}
            onDelete={onDeleteMessage}
          />
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
