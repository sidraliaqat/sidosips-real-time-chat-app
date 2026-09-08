/**
 * Inline error banner for form / async failures.
 */
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </div>
  );
}
