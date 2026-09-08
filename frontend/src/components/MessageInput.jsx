import { useRef, useState } from 'react';
import AttachmentMenu from './AttachmentMenu';
import Loader from './Loader';
import { useChat } from '../hooks/useChat';
import { useToast } from '../context/ToastContext';
import * as messageService from '../services/messageService';
import { getErrorMessage } from '../services/api';

const MAX_FILE_SIZE_MB = 10;

export default function MessageInput({ chatId }) {
  const { sendMessage, notifyTyping, notifyStopTyping } = useChat();
  const { toast } = useToast();

  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // { file, kind, previewUrl, fileName }
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef(null);

  function handleTextChange(e) {
    const value = e.target.value;
    setText(value);
    if (value.trim()) {
      notifyTyping(chatId);
    } else {
      notifyStopTyping(chatId);
    }
  }

  function handleFileChosen(file, kind) {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    const previewUrl = kind === 'image' ? URL.createObjectURL(file) : null;
    setPendingFile({ file, kind, previewUrl, fileName: file.name });
  }

  function cancelPendingFile() {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
    setProgress(0);
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;

    notifyStopTyping(chatId);

    if (pendingFile) {
      try {
        setUploading(true);
        const uploaded = await messageService.uploadFile(pendingFile.file, setProgress);
        sendMessage({
          chatId,
          content: trimmed || null,
          messageType: uploaded.messageType,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
        });
        cancelPendingFile();
        setText('');
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setUploading(false);
        setProgress(0);
      }
      return;
    }

    sendMessage({ chatId, content: trimmed, messageType: 'text' });
    setText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = (text.trim().length > 0 || pendingFile) && !uploading;

  return (
    <div className="message-input-bar">
      <AttachmentMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onFileChosen={handleFileChosen} />

      {pendingFile && (
        <div className="file-preview-bar">
          {pendingFile.previewUrl ? (
            <img src={pendingFile.previewUrl} alt="" className="file-preview-thumb" />
          ) : (
            <div className="file-preview-thumb" />
          )}
          <div className="file-preview-info">
            <div className="file-preview-name">{pendingFile.fileName}</div>
            {uploading && (
              <div className="file-preview-progress">
                <div className="file-preview-progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          <button className="btn-icon" onClick={cancelPendingFile} disabled={uploading} aria-label="Remove attachment">
            ✕
          </button>
        </div>
      )}

      <div className="message-input-row">
        <button
          type="button"
          className="btn-icon"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Attach a file"
          aria-haspopup="menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          className="message-textarea"
          placeholder="Type a message..."
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          aria-label="Type a message"
        />

        <button
          type="button"
          className="send-btn"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
        >
          {uploading ? (
            <Loader />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
