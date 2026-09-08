// Small, dependency-free date/time formatting helpers.

export function formatMessageTime(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatChatListTime(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export function formatDateDivider(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatLastSeen(dateInput) {
  if (!dateInput) return 'Last seen recently';
  const date = new Date(dateInput);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return 'Last seen just now';
  if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return `Last seen today at ${formatMessageTime(date)}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Last seen yesterday at ${formatMessageTime(date)}`;
  }

  return `Last seen ${date.toLocaleDateString([], { day: '2-digit', month: 'short' })}`;
}
