import { formatLastSeen } from '../utils/formatDate';

/**
 * Small text indicator: "Online" in blush, or a formatted last-seen string.
 */
export default function OnlineIndicator({ isOnline, lastSeen }) {
  if (isOnline) {
    return <span style={{ color: 'var(--color-success)' }}>Online</span>;
  }
  return <span>{formatLastSeen(lastSeen)}</span>;
}
