import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Loader';

/**
 * The very first screen. Logged-in users are sent straight to /chat —
 * everyone else sees a full-page hero with the brand and two clear
 * calls to action instead of an auto-redirecting splash.
 */
export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="landing-screen">
        <span className="splash-shape s1" aria-hidden="true" />
        <span className="splash-shape s2" aria-hidden="true" />
        <span className="splash-shape s3" aria-hidden="true" />
        <div className="landing-grid-overlay" aria-hidden="true" />
        <div style={{ position: 'relative', zIndex: 2, color: 'rgba(255,255,255,0.8)' }}>
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="landing-screen">
      <span className="splash-shape s1" aria-hidden="true" />
      <span className="splash-shape s2" aria-hidden="true" />
      <span className="splash-shape s3" aria-hidden="true" />
      <div className="landing-grid-overlay" aria-hidden="true" />

      <div className="landing-content">
        <span className="landing-badge">
          <span className="landing-badge-dot" aria-hidden="true" />
          Real-time messaging, reimagined
        </span>

        <h1 className="landing-title">sidosips</h1>
        <p className="landing-tagline">Sip. Chat. Connect.</p>

        <div className="landing-actions">
          <Link to="/login" className="landing-btn landing-btn-primary">
            Log In
          </Link>
          <Link to="/register" className="landing-btn landing-btn-secondary">
            Sign Up
          </Link>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-icon" aria-hidden="true">💬</span>
            Instant messaging with typing &amp; read receipts
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon" aria-hidden="true">👥</span>
            Private chats and group conversations
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon" aria-hidden="true">📎</span>
            Share photos and files instantly
          </div>
        </div>
      </div>
    </div>
  );
}
