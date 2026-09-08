import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UserAvatar from '../components/UserAvatar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { validateName } from '../utils/validation';
import * as userService from '../services/userService';
import * as messageService from '../services/messageService';
import { getErrorMessage } from '../services/api';

export default function Profile() {
  const { user, logout, updateLocalUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    userService
      .getBlockedUsers()
      .then((list) => {
        if (!cancelled) setBlockedUsers(list);
      })
      .catch(() => {
        // Non-critical for the page to still be usable — fail silently here.
      })
      .finally(() => {
        if (!cancelled) setLoadingBlocked(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveName() {
    const err = validateName(name);
    if (err) {
      setNameError(err);
      return;
    }
    setNameError(null);
    setSaving(true);
    try {
      const updated = await userService.updateProfile({ name: name.trim() });
      updateLocalUser(updated);
      toast.success('Profile updated successfully');
    } catch (err2) {
      toast.error(getErrorMessage(err2));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const uploaded = await messageService.uploadFile(file);
      const updated = await userService.updateProfile({ profileImage: uploaded.fileUrl });
      updateLocalUser(updated);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  }

  async function handleUnblock(userId) {
    setUnblockingId(userId);
    try {
      await userService.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User unblocked');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUnblockingId(null);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="profile-shell">
      <Navbar title="Profile" onBack={() => navigate('/chat')} />

      <div className="profile-container">
        <div className="profile-hero">
          <label className="profile-avatar-edit">
            <UserAvatar name={user.name} image={user.profileImage} />
            <span className="profile-avatar-edit-btn" aria-hidden="true">
              {uploadingAvatar ? <Loader /> : '📷'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
              aria-label="Change profile photo"
            />
          </label>
          <h2>{user.name}</h2>
          <div className="profile-status-row">
            <span className="profile-status-dot" />
            Online
          </div>
        </div>

        <div className="profile-card">
          <div className="field">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              className={`input ${nameError ? 'has-error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && <div className="field-error">{nameError}</div>}
          </div>

          <div className="field">
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" className="input" value={user.email} disabled />
            <div className="field-hint">Email addresses can't be changed.</div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveName} disabled={saving || name === user.name}>
            {saving ? <Loader /> : 'Save changes'}
          </button>
        </div>

        <div className="profile-card">
          <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>Blocked users</h3>
          <p style={{ marginBottom: 16, fontSize: '0.85rem' }}>
            People you've blocked can't send you messages, and you can't send messages to them.
          </p>

          {loadingBlocked ? (
            <Loader label="Loading..." />
          ) : blockedUsers.length === 0 ? (
            <EmptyState
              icon={<span aria-hidden="true">🚫</span>}
              title="No blocked users"
              description="Anyone you block will show up here so you can unblock them later."
            />
          ) : (
            <div className="stack">
              {blockedUsers.map((u) => (
                <div className="member-row" key={u.id}>
                  <UserAvatar name={u.name} image={u.profileImage} size={40} />
                  <div className="member-row-body">
                    <div className="member-row-name">{u.name}</div>
                    <div className="member-row-status">{u.email}</div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    onClick={() => handleUnblock(u.id)}
                    disabled={unblockingId === u.id}
                  >
                    {unblockingId === u.id ? <Loader /> : 'Unblock'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-card profile-danger-zone">
          <h3 style={{ color: 'var(--color-danger)', fontSize: '1rem' }}>Log out</h3>
          <p style={{ marginBottom: 16 }}>You'll need to log in again to access your chats.</p>
          <button className="btn btn-danger" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </div>
  );
}
