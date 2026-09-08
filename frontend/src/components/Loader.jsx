/**
 * A simple centered spinner. Use `fullPage` for a screen-filling loading state.
 */
export default function Loader({ fullPage = false, label }) {
  if (fullPage) {
    return (
      <div className="loader-page" role="status" aria-live="polite">
        <div className="stack" style={{ alignItems: 'center', gap: 10 }}>
          <span className="loader" />
          {label && <span className="muted">{label}</span>}
        </div>
      </div>
    );
  }

  return (
    <span className="loader" role="status" aria-label={label || 'Loading'} />
  );
}
