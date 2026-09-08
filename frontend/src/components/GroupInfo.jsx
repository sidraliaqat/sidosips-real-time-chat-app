import { useState } from 'react';
import UserAvatar from './UserAvatar';
import MemberList from './MemberList';
import Modal from './Modal';
import SearchBar from './SearchBar';
import Loader from './Loader';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import * as userService from '../services/userService';
import * as messageService from '../services/messageService';
import { getErrorMessage } from '../services/api';

export default function GroupInfo({ chat, onClose }) {
  const { user } = useAuth();
  const { addMemberToActiveChat, removeMemberFromActiveChat, leaveActiveGroup, updateActiveGroup, onlineUserIds } =
    useChat();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(chat.name);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const currentMember = chat.participants?.find((p) => p.id === user.id);
  const isAdmin = Boolean(currentMember?.isAdmin);
  const onlineCount = chat.participants?.filter((p) => onlineUserIds.has(p.id)).length || 0;
  const existingIds = new Set(chat.participants?.map((p) => p.id));

  async function handleSearchToAdd(query) {
    setSearching(true);
    try {
      const result = await userService.searchUsers({ search: query, limit: 20 });
      setSearchResults(result.users.filter((u) => !existingIds.has(u.id)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  async function handleAddMember(userId) {
    try {
      await addMemberToActiveChat(userId);
      toast.success('Member added');
      setAddOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await removeMemberFromActiveChat(userId);
      toast.success('Member removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleSaveName() {
    if (!nameDraft.trim()) return;
    try {
      await updateActiveGroup({ name: nameDraft.trim() });
      toast.success('Group name updated');
      setEditingName(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleGroupImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploaded = await messageService.uploadFile(file);
      await updateActiveGroup({ image: uploaded.fileUrl });
      toast.success('Group photo updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  async function handleLeave() {
    try {
      await leaveActiveGroup();
      toast.success('You left the group');
    } catch (err) {
      toast.error(getErrorMessage(err));
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
        <strong>Group Info</strong>
      </div>

      <div className="info-panel-hero">
        {isAdmin ? (
          <label className="profile-avatar-edit" style={{ cursor: 'pointer', display: 'inline-block' }}>
            <UserAvatar name={chat.name} image={chat.image} size={92} collageMembers={chat.participants} />
            <span className="profile-avatar-edit-btn" aria-hidden="true">
              {uploadingImage ? <Loader /> : '📷'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={handleGroupImageChange}
              disabled={uploadingImage}
              aria-label="Change group photo"
            />
          </label>
        ) : (
          <UserAvatar name={chat.name} image={chat.image} size={92} collageMembers={chat.participants} />
        )}
        {editingName ? (
          <div className="row gap-8" style={{ justifyContent: 'center', marginTop: 10 }}>
            <input className="input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} style={{ maxWidth: 180 }} />
            <button className="btn-icon" onClick={handleSaveName} aria-label="Save name">✓</button>
          </div>
        ) : (
          <h3 onClick={() => isAdmin && setEditingName(true)} style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
            {chat.name}
          </h3>
        )}
        <p>
          {chat.participants?.length || 0} members · {onlineCount} online
        </p>
      </div>

      <div className="info-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <span className="info-section-title" style={{ marginBottom: 0 }}>
            Members
          </span>
          {isAdmin && (
            <button className="btn-ghost btn" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setAddOpen(true)}>
              + Add
            </button>
          )}
        </div>
        <MemberList
          members={chat.participants || []}
          canManage={isAdmin}
          currentUserId={user.id}
          onRemove={handleRemoveMember}
        />
      </div>

      <div className="info-section">
        {!confirmLeave ? (
          <button className="info-list-item danger" onClick={() => setConfirmLeave(true)}>
            🚪 Leave group
          </button>
        ) : (
          <div className="stack gap-8">
            <p className="muted" style={{ fontSize: '0.85rem' }}>Are you sure you want to leave this group?</p>
            <div className="row gap-8">
              <button className="btn btn-danger" onClick={handleLeave}>Yes, leave</button>
              <button className="btn btn-ghost" onClick={() => setConfirmLeave(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Members">
        <SearchBar placeholder="Search users..." onSearch={handleSearchToAdd} autoFocus />
        <div className="user-pick-list">
          {searching && <Loader label="Searching..." />}
          {!searching && searchResults.length === 0 && <p className="muted">No users found.</p>}
          {searchResults.map((u) => (
            <button key={u.id} type="button" className="user-pick-row" onClick={() => handleAddMember(u.id)}>
              <UserAvatar name={u.name} image={u.profileImage} size={38} />
              <div className="user-pick-row-body">
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.name}</div>
                <div className="muted" style={{ fontSize: '0.76rem' }}>{u.email}</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
