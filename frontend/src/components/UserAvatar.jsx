import { resolveFileUrl } from '../services/api';

const PALETTE = ['#DE638A', '#C6BADE', '#4A3267', '#F3D9E5'];

function colorForName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Displays a user or group avatar: an uploaded image if present,
 * otherwise a colored circle with initials.
 *
 * Props:
 *  - name: string (used for initials + deterministic color)
 *  - image: string | null (profile_image or group image URL)
 *  - size: number (px, default 44)
 *  - isOnline: boolean (adds a green dot, private chats/users only)
 *  - onDark: boolean (adjusts the online-dot border for dark backgrounds)
 */
/**
 * Displays a user or group avatar: an uploaded image if present,
 * otherwise a colored circle with initials — or, for groups with no
 * custom photo, a 2x2 collage of the first few members' avatars.
 *
 * Props:
 *  - name: string (used for initials + deterministic color)
 *  - image: string | null (profile_image or group image URL)
 *  - size: number (px, default 44)
 *  - isOnline: boolean (adds a green dot, private chats/users only)
 *  - onDark: boolean (adjusts the online-dot border for dark backgrounds)
 *  - collageMembers: array of { id, name, profileImage } — used as a
 *    fallback visual identity for groups with no custom photo (needs 2+).
 */
export default function UserAvatar({ name, image, size = 44, isOnline, onDark = false, collageMembers }) {
  const style = {
    width: size,
    height: size,
    fontSize: size * 0.38,
    backgroundColor: image ? undefined : colorForName(name),
  };

  const showCollage = !image && collageMembers && collageMembers.length >= 2;

  return (
    <span className="avatar-wrap" style={{ width: size, height: size }}>
      {showCollage ? (
        <span className="avatar avatar-collage" style={{ width: size, height: size }} aria-hidden="true">
          {collageMembers.slice(0, 4).map((m, i) => (
            <span
              key={m.id ?? i}
              className="avatar-collage-cell"
              style={{ backgroundColor: m.profileImage ? undefined : colorForName(m.name || '?') }}
            >
              {m.profileImage ? (
                <img src={resolveFileUrl(m.profileImage)} alt="" />
              ) : (
                (m.name || '?').trim().charAt(0).toUpperCase()
              )}
            </span>
          ))}
        </span>
      ) : image ? (
        <img className="avatar" src={resolveFileUrl(image)} alt={name} style={style} />
      ) : (
        <span className="avatar" style={style} aria-hidden="true">
          {initials(name)}
        </span>
      )}
      {typeof isOnline === 'boolean' && (
        <span
          className={`avatar-online-dot ${onDark ? 'on-dark' : ''}`}
          aria-label={isOnline ? 'Online' : 'Offline'}
          style={{ opacity: isOnline ? 1 : 0 }}
        />
      )}
    </span>
  );
}
