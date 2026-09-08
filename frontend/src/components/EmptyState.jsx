/**
 * A friendly centered empty state — used when a chat isn't selected,
 * a search has no results, a chat has no messages yet, etc.
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
