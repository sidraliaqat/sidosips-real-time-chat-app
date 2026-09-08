import { useRef } from 'react';

/**
 * Props: isOpen, onClose, onFileChosen(file, kind) where kind is 'image' | 'file'
 */
export default function AttachmentMenu({ isOpen, onClose, onFileChosen }) {
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="attachment-menu" role="menu">
      <button
        type="button"
        className="attachment-menu-item"
        role="menuitem"
        onClick={() => {
          imageInputRef.current?.click();
        }}
      >
        <span className="attachment-menu-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </span>
        Image
      </button>

      <button
        type="button"
        className="attachment-menu-item"
        role="menuitem"
        onClick={() => {
          fileInputRef.current?.click();
        }}
      >
        <span className="attachment-menu-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </span>
        Document
      </button>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="visually-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileChosen(file, 'image');
          e.target.value = '';
          onClose();
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        className="visually-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileChosen(file, 'file');
          e.target.value = '';
          onClose();
        }}
      />
    </div>
  );
}
