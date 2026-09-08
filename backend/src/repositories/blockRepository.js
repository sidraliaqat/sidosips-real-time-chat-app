const { query } = require('../config/db');

async function block(blockerId, blockedId) {
  const result = await query(
    `INSERT INTO blocked_users (blocker_id, blocked_id)
     VALUES ($1, $2)
     ON CONFLICT (blocker_id, blocked_id) DO NOTHING
     RETURNING *`,
    [blockerId, blockedId]
  );
  return result.rows[0] || null;
}

async function unblock(blockerId, blockedId) {
  await query('DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2', [blockerId, blockedId]);
}

/** True if either user has blocked the other (blocks messaging both ways). */
async function isBlockedBetween(userIdA, userIdB) {
  const result = await query(
    `SELECT 1 FROM blocked_users
     WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [userIdA, userIdB]
  );
  return result.rowCount > 0;
}

/** True specifically if `blockerId` has blocked `blockedId` (direction matters for UI state). */
async function hasBlocked(blockerId, blockedId) {
  const result = await query(
    'SELECT 1 FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2',
    [blockerId, blockedId]
  );
  return result.rowCount > 0;
}

/** Full profile info for everyone a given user has blocked (for a "Blocked users" settings list). */
async function listBlockedByUser(blockerId) {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.profile_image, bu.created_at AS blocked_at
     FROM blocked_users bu
     JOIN users u ON u.id = bu.blocked_id
     WHERE bu.blocker_id = $1
     ORDER BY bu.created_at DESC`,
    [blockerId]
  );
  return result.rows;
}

module.exports = { block, unblock, isBlockedBetween, hasBlocked, listBlockedByUser };
