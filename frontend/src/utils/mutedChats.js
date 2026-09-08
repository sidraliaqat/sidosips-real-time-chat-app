// A genuinely functional "mute notifications" preference, scoped per browser.
// Muted chats are excluded from toast pop-ups triggered by the `notification`
// socket event (see ChatContext). This has no database table backing it —
// it's a local device preference, exactly like muting a thread on a phone.

const STORAGE_KEY = 'sidosips_muted_chats';

function readSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeSet(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}

export function isChatMuted(chatId) {
  return readSet().has(chatId);
}

export function setChatMuted(chatId, muted) {
  const set = readSet();
  if (muted) set.add(chatId);
  else set.delete(chatId);
  writeSet(set);
}
