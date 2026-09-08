import { useState } from 'react';
import UserAvatar from './UserAvatar';
import OnlineIndicator from './OnlineIndicator';
import Loader from './Loader';
import { useChat } from '../hooks/useChat';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

export default function MemberList({ members, canManage, currentUserId, onRemove }) {
  const { onlineUserIds, setContactNickname, clearContactNickname } = useChat();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  function startEditing(member) {
    setEditingId(member.id);
    setDraft(member.nickname || '');
  }

  async function handleSave(member) {
    const trimmed = draft.trim();
    setSaving(true);
    try {
      if (trimmed) {
        await setContactNickname(member.id, trimmed);
        toast.success('Nickname saved');
      } else {
        await clearContactNickname(member.id);
        toast.success('Nickname removed');
      }
      setEditingId(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {members.map((member) => {
        const isOnline = onlineUserIds.has(member.id);
        const isEditing = editingId === member.id;

        if (isEditing) {
          return (
            <div className="member-row" key={member.id} style={{ alignItems: 'flex-start' }}>
              <UserAvatar name={member.name} image={member.profileImage} size={40} isOnline={isOnline} />
              <div className="member-row-body">
                <input
                  className="input"
                  placeholder="Add a nickname..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.85rem', marginBottom: 6 }}
                  autoFocus
                />
                <div className="row gap-8">
                  <button
                    className="btn btn-primary"
                    style={{ padding: '5px 14px', fontSize: '0.78rem' }}
                    onClick={() => handleSave(member)}
                    disabled={saving}
                  >
                    {saving ? <Loader /> : 'Save'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '5px 14px', fontSize: '0.78rem' }}
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="member-row" key={member.id}>
            <UserAvatar name={member.name} image={member.profileImage} size={40} isOnline={isOnline} />
            <div className="member-row-body">
              <div className="member-row-name">
                {member.name}
                {member.isAdmin && <span className="badge-admin">Admin</span>}
                {member.id === currentUserId && <span className="muted">(You)</span>}
              </div>
              <div className="member-row-status">
                <OnlineIndicator isOnline={isOnline} lastSeen={member.lastSeen} />
              </div>
            </div>
            {member.id !== currentUserId && (
              <button
                className="btn-icon"
                style={{ width: 30, height: 30 }}
                onClick={() => startEditing(member)}
                aria-label={`Set a nickname for ${member.realName || member.name}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {canManage && member.id !== currentUserId && !member.isAdmin && (
              <button className="btn-icon" onClick={() => onRemove(member.id)} aria-label={`Remove ${member.name}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
