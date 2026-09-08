import { useNavigate } from 'react-router-dom';

export default function Navbar({ title, onBack, actions }) {
  const navigate = useNavigate();

  return (
    <div className="profile-topbar">
      <button
        className="btn-icon"
        onClick={onBack || (() => navigate(-1))}
        aria-label="Go back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h2>{title}</h2>
      {actions && <div style={{ marginLeft: 'auto' }}>{actions}</div>}
    </div>
  );
}
