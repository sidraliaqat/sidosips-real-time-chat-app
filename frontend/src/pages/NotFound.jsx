import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="notfound-screen">
      <p className="notfound-code">404</p>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>
        Back to sidosips
      </Link>
    </div>
  );
}
