import { useEffect, useState } from 'react';
import Modal from './Modal';
import SearchBar from './SearchBar';
import UserAvatar from './UserAvatar';
import Loader from './Loader';
import * as userService from '../services/userService';
import * as messageService from '../services/messageService';
import { useChat } from '../hooks/useChat';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

export default function NewChatModal({ isOpen, onClose, onChatOpened }) {
  const [step, setStep] = useState('choice'); // 'choice' | 'private' | 'group'
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupImagePreview, setGroupImagePreview] = useState(null);
  const [groupImageUrl, setGroupImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);

  const { startPrivateChat, createGroup } = useChat();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setStep('choice');
      setUsers([]);
      setSelectedIds([]);
      setGroupName('');
      setGroupImagePreview(null);
      setGroupImageUrl(null);
    }
  }, [isOpen]);

  async function handleSearch(query) {
    setLoadingUsers(true);
    try {
      const result = await userService.searchUsers({ search: query, limit: 20 });
      setUsers(result.users);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (step === 'private' || step === 'group') handleSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handlePickPrivateUser(userId) {
    try {
      const chat = await startPrivateChat(userId);
      onClose();
      onChatOpened(chat.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function toggleMember(userId) {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  async function handleGroupImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGroupImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const uploaded = await messageService.uploadFile(file);
      setGroupImageUrl(uploaded.fileUrl);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setGroupImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleCreateGroup() {
    if (!groupName.trim()) {
      toast.error('Group name is required.');
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('Select at least one member.');
      return;
    }
    setCreating(true);
    try {
      const chat = await createGroup({ name: groupName.trim(), image: groupImageUrl, memberIds: selectedIds });
      toast.success('Group created successfully');
      onClose();
      onChatOpened(chat.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  const title = step === 'choice' ? 'New Chat' : step === 'private' ? 'Start a Private Chat' : 'Create a Group';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {step === 'choice' && (
        <div className="stack gap-12">
          <button className="btn btn-secondary btn-block" onClick={() => setStep('private')}>
            💬 New Private Chat
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => setStep('group')}>
            👥 Create Group
          </button>
        </div>
      )}

      {step === 'private' && (
        <div>
          <SearchBar placeholder="Search by name or email..." onSearch={handleSearch} autoFocus />
          <div className="user-pick-list">
            {loadingUsers && <Loader label="Searching..." />}
            {!loadingUsers && users.length === 0 && <p className="muted">No users found.</p>}
            {users.map((u) => (
              <button key={u.id} type="button" className="user-pick-row" onClick={() => handlePickPrivateUser(u.id)}>
                <UserAvatar name={u.name} image={u.profileImage} size={40} isOnline={u.isOnline} />
                <div className="user-pick-row-body">
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'group' && (
        <div>
          <div className="avatar-upload">
            <label className="avatar-upload-btn" htmlFor="group-image-input">
              {groupImagePreview ? (
                <img src={groupImagePreview} alt="Group preview" />
              ) : uploadingImage ? (
                <Loader />
              ) : (
                <UserAvatar name={groupName || 'Group'} size={60} />
              )}
            </label>
            <input
              id="group-image-input"
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={handleGroupImageChange}
              disabled={uploadingImage}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Group photo (optional)</div>
              <div className="muted" style={{ fontSize: '0.78rem' }}>Tap the circle to upload one.</div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="group-name">Group name</label>
            <input
              id="group-name"
              className="input"
              placeholder="e.g. Coffee Crew"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="chip-list">
              {selectedIds.map((id) => {
                const u = users.find((usr) => usr.id === id);
                return (
                  <span className="chip" key={id}>
                    {u?.name || 'User'}
                    <button onClick={() => toggleMember(id)} aria-label={`Remove ${u?.name}`}>✕</button>
                  </span>
                );
              })}
            </div>
          )}

          <SearchBar placeholder="Search members to add..." onSearch={handleSearch} />
          <div className="user-pick-list">
            {loadingUsers && <Loader label="Searching..." />}
            {users.map((u) => (
              <label key={u.id} className="user-pick-row">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  style={{ marginRight: 4 }}
                  aria-label={`Select ${u.name}`}
                />
                <UserAvatar name={u.name} image={u.profileImage} size={40} isOnline={u.isOnline} />
                <div className="user-pick-row-body">
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>{u.email}</div>
                </div>
              </label>
            ))}
          </div>

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleCreateGroup} disabled={creating}>
            {creating ? <Loader /> : 'Create Group'}
          </button>
        </div>
      )}
    </Modal>
  );
}
