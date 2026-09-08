import { useState } from 'react';
import { formatMessageTime } from '../utils/formatDate';
import { resolveFileUrl } from '../services/api';
import MessageInfoModal from './MessageInfoModal';

function StatusTicks({ status }) {
  if (status === 'sent') {
    return (
      <span className="msg-status-ticks" title="Sent">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  const isRead = status === 'read';
  return (
    <span className={`msg-status-ticks ${isRead ? 'read' : ''}`} title={isRead ? 'Read by everyone' : 'Delivered'}>
      <svg width="18" height="14" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="1 12 7 18 16 6" />
        <polyline points="12 12 18 18 29 4" />
      </svg>
    </span>
  );
}

export default function MessageBubble({ message, isOwn, showSenderName, isGroup, recipientCount = 0, onDelete }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const showSeenBy = isOwn && isGroup && recipientCount > 0;

  return (
    <div className={`msg-row ${isOwn ? 'own' : 'other'}`}>
      {showSenderName && !isOwn && <div className="msg-group-sender">{message.senderName}</div>}
      <div className="msg-bubble-wrap">
        {isOwn && !confirmDelete && (
          <button
            className="btn-icon"
            style={{ width: 28, height: 28 }}
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete message"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
        <div className="msg-bubble">
          {message.messageType === 'image' && message.fileUrl && (
            <>
              <img
                src={resolveFileUrl(message.fileUrl)}
                alt={message.fileName || 'Shared image'}
                className="msg-image"
                onClick={() => setLightboxOpen(true)}
              />
              {lightboxOpen && (
                <div
                  className="modal-overlay"
                  onMouseDown={() => setLightboxOpen(false)}
                  style={{ zIndex: 999 }}
                >
                  <img
                    src={resolveFileUrl(message.fileUrl)}
                    alt={message.fileName || 'Shared image'}
                    style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }}
                  />
                </div>
              )}
            </>
          )}

          {message.messageType === 'file' && message.fileUrl && (
            <a
              href={resolveFileUrl(message.fileUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="msg-file"
              download={message.fileName}
            >
              <span className="msg-file-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <span className="msg-file-name">{message.fileName || 'Download file'}</span>
            </a>
          )}

          {message.content && <div>{message.content}</div>}

          <div className="msg-meta">
            {showSeenBy && (
              <button
                onClick={() => setInfoOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--color-text-muted)',
                  fontSize: '0.68rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Seen by {message.readCount || 0}/{recipientCount}
              </button>
            )}
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn && <StatusTicks status={message.status} />}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className={`msg-row ${isOwn ? 'own' : 'other'}`} style={{ marginTop: 2 }}>
          <div className="row gap-8" style={{ fontSize: '0.76rem' }}>
            <span className="muted">Delete this message?</span>
            <button
              className="btn-ghost btn"
              style={{ padding: '2px 8px', fontSize: '0.74rem', color: 'var(--color-danger)' }}
              onClick={() => {
                onDelete(message.id);
                setConfirmDelete(false);
              }}
            >
              Delete
            </button>
            <button
              className="btn-ghost btn"
              style={{ padding: '2px 8px', fontSize: '0.74rem' }}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSeenBy && (
        <MessageInfoModal messageId={message.id} isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
      )}
    </div>
  );
}
