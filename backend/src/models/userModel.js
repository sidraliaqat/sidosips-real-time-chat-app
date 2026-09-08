/**
 * Domain-level helpers for the "user" concept.
 * Repositories talk to PostgreSQL; this module shapes that data for
 * the outside world and centralizes the "never expose password_hash" rule.
 */

function toSafeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    profileImage: row.profile_image,
    isOnline: row.is_online,
    lastSeen: row.last_seen,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSafeUserList(rows) {
  return (rows || []).map(toSafeUser);
}

module.exports = { toSafeUser, toSafeUserList };
