import { useEffect, useState } from 'react';
import Modal from './Modal';
import UserAvatar from './UserAvatar';
import Loader from './Loader';
import * as messageService from '../services/messageService';
import { formatMessageTime } from '../utils/formatDate';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function MessageInfoModal({ messageId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !messageId) return;
    let cancelled = false;

    setLoading(true);
    messageService
      .getMessageInfo(messageId)
      .then((result) => {
        if (!cancelled) setInfo(result);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err));
        onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, messageId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Message Info">
      {loading || !info ? (
        <Loader fullPage label="Loading..." />
      ) : (
        <div>
          <div style={{ marginBottom: 18 }}>
            <div className="info-section-title">
              Seen by ({info.seenBy.length}/{info.totalRecipients})
            </div>
            {info.seenBy.length === 0 ? (
              <p className="muted" style={{ fontSize: '0.85rem' }}>No one has seen this message yet.</p>
            ) : (
              info.seenBy.map((person) => (
                <div className="member-row" key={person.id}>
                  <UserAvatar name={person.name} image={person.profileImage} size={38} />
                  <div className="member-row-body">
                    <div className="member-row-name">{person.name}</div>
                    <div className="member-row-status">Seen at {formatMessageTime(person.readAt)}</div>
                  </div>
                  <span style={{ color: 'var(--color-blush-dark)' }} aria-hidden="true">✓✓</span>
                </div>
              ))
            )}
          </div>

          {info.notSeenBy.length > 0 && (
            <div>
              <div className="info-section-title">Not seen yet ({info.notSeenBy.length})</div>
              {info.notSeenBy.map((person) => (
                <div className="member-row" key={person.id}>
                  <UserAvatar name={person.name} image={person.profileImage} size={38} />
                  <div className="member-row-body">
                    <div className="member-row-name">{person.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
