export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-brand">sidosips</div>
          <p className="auth-visual-tagline">Sip. Chat. Connect.</p>

          <div className="auth-visual-point">
            <span className="auth-visual-point-icon" aria-hidden="true">💬</span>
            Real-time messaging with typing indicators and read receipts
          </div>
          <div className="auth-visual-point">
            <span className="auth-visual-point-icon" aria-hidden="true">👥</span>
            Private chats and group conversations
          </div>
          <div className="auth-visual-point">
            <span className="auth-visual-point-icon" aria-hidden="true">📎</span>
            Share images and files instantly
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
