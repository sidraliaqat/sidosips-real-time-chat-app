import { useEffect, useMemo, useState } from 'react';
import UserAvatar from './UserAvatar';
import OnlineIndicator from './OnlineIndicator';
import Loader from './Loader';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { isChatMuted, setChatMuted } from '../utils/mutedChats';
import * as userService from '../services/userService';
import * as messageService from '../services/messageService';
import { getErrorMessage, resolveFileUrl } from '../services/api';

export default function ChatInfo({ chat, onClose }) {
  const { user } = useAuth();
  const { messages, onlineUserIds, deleteChat, closeChat, refreshChats, setContactNickname, clearContactNickname } =
    useChat();
  const { toast } = useToast();

  const otherUser = chat.participants?.find((p) => p.id !== user.id);
  const isOnline = otherUser ? onlineUserIds.has(otherUser.id) : false;

  const [muted, setMuted] = useState(isChatMuted(chat.id));
  const [isBlocked, setIsBlocked] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (otherUser) {
      userService.getUserById(otherUser.id).then((u) => {
        if (!cancelled) setIsBlocked(Boolean(u.isBlockedByMe));
      }).catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [otherUser?.id]);

  const mediaMessages = useMemo(
    () => messages.filter((m) => m.messageType === 'image' || m.messageType === 'file'),
    [messages]
  );

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setChatMuted(chat.id, next);
    toast.success(next ? 'Notifications muted for this chat' : 'Notifications unmuted');
  }

  async function handleClearChat() {
    setBusy(true);
    try {
      await messageService.clearChat(chat.id);
      toast.success('Chat cleared');
      setConfirmClear(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleBlock() {
    if (!otherUser) return;
    setBusy(true);
    try {
      if (isBlocked) {
        await userService.unblockUser(otherUser.id);
        setIsBlocked(false);
        toast.success(`${otherUser.name} has been unblocked`);
      } else {
        await userService.blockUser(otherUser.id);
        setIsBlocked(true);
        toast.success(`${otherUser.name} has been blocked`);
      }
      setConfirmBlock(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteChat() {
    setBusy(true);
    try {
      await deleteChat(chat.id);
      closeChat();
      await refreshChats();
      toast.success('Chat deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function startEditingNickname() {
    setNicknameDraft(otherUser?.nickname || '');
    setEditingNickname(true);
  }

  async function handleSaveNickname() {
    if (!otherUser) return;
    const trimmed = nicknameDraft.trim();
    setSavingNickname(true);
    try {
      if (trimmed) {
        await setContactNickname(otherUser.id, trimmed);
        toast.success('Nickname saved');
      } else {
        await clearContactNickname(otherUser.id);
        toast.success('Nickname removed');
      }
      setEditingNickname(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingNickname(false);
    }
  }

  return (
    <div className="info-panel">
      <div className="info-panel-header">
        <button className="btn-icon" onClick={onClose} aria-label="Close info panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <strong>Contact Info</strong>
      </div>

      <div className="info-panel-hero">
        <UserAvatar name={otherUser?.name || ''} image={otherUser?.profileImage} size={92} />

        {editingNickname ? (
          <div className="stack gap-8" style={{ alignItems: 'center', marginTop: 6 }}>
            <input
              className="input"
              placeholder="Add a nickname..."
              value={nicknameDraft}
              onChange={(e) => setNicknameDraft(e.target.value)}
              style={{ maxWidth: 200, textAlign: 'center' }}
              autoFocus
            />
            <div className="row gap-8">
              <button className="btn btn-primary" style={{ padding: '8px 18px' }} onClick={handleSaveNickname} disabled={savingNickname}>
                {savingNickname ? <Loader /> : 'Save'}
              </button>
              <button className="btn btn-ghost" onClick={() => setEditingNickname(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {otherUser?.name}
              <button
                className="btn-icon"
                style={{ width: 26, height: 26 }}
                onClick={startEditingNickname}
                aria-label="Set a nickname for this contact"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </h3>
            {otherUser?.nickname && (
              <p className="muted" style={{ fontSize: '0.78rem', marginTop: -6 }}>
                Real name: {otherUser.realName}
              </p>
            )}
          </>
        )}

        <p><OnlineIndicator isOnline={isOnline} lastSeen={otherUser?.lastSeen} /></p>
        <p className="muted" style={{ fontSize: '0.82rem' }}>{otherUser?.email}</p>
      </div>

      <div className="info-section">
        <div className="info-section-title">Media, Links &amp; Files ({mediaMessages.length})</div>
        {mediaMessages.length === 0 ? (
          <p className="muted" style={{ fontSize: '0.85rem' }}>No shared media yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {mediaMessages.slice(0, 9).map((m) =>
              m.messageType === 'image' ? (
                <a key={m.id} href={resolveFileUrl(m.fileUrl)} target="_blank" rel="noopener noreferrer">
                  <img
                    src={resolveFileUrl(m.fileUrl)}
                    alt=""
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                  />
                </a>
              ) : (
                <a
                  key={m.id}
                  href={resolveFileUrl(m.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '1',
                    background: 'var(--color-mimi-pink)',
                    borderRadius: 8,
                    fontSize: '0.7rem',
                    color: 'var(--color-violet)',
                    textAlign: 'center',
                    padding: 4,
                  }}
                >
                  📎 {m.fileName?.slice(0, 10) || 'File'}
                </a>
              )
            )}
          </div>
        )}
      </div>

      <div className="info-section">
        <button className="info-list-item" onClick={toggleMute}>
          {muted ? '🔔 Unmute notifications' : '🔕 Mute notifications'}
        </button>

        {!confirmClear ? (
          <button className="info-list-item" onClick={() => setConfirmClear(true)}>
            🧹 Clear chat
          </button>
        ) : (
          <div className="stack gap-8" style={{ padding: '8px 0' }}>
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              This deletes every message in this chat for both of you. This can't be undone.
            </p>
            <div className="row gap-8">
              <button className="btn btn-danger" onClick={handleClearChat} disabled={busy}>Clear chat</button>
              <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Cancel</button>
            </div>
          </div>
        )}

        {!confirmBlock ? (
          <button className="info-list-item danger" onClick={() => setConfirmBlock(true)}>
            {isBlocked ? '✅ Unblock user' : '🚫 Block user'}
          </button>
        ) : (
          <div className="stack gap-8" style={{ padding: '8px 0' }}>
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              {isBlocked
                ? `Unblock ${otherUser?.name}? They will be able to message you again.`
                : `Block ${otherUser?.name}? Neither of you will be able to send messages to each other.`}
            </p>
            <div className="row gap-8">
              <button className="btn btn-danger" onClick={handleToggleBlock} disabled={busy}>
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmBlock(false)}>Cancel</button>
            </div>
          </div>
        )}

        <button className="info-list-item danger" onClick={handleDeleteChat} disabled={busy}>
          🗑 Delete chat
        </button>
      </div>
    </div>
  );
}
