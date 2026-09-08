const { query } = require('../config/db');

async function setNickname(ownerId, contactId, nickname) {
  const result = await query(
    `INSERT INTO contact_nicknames (owner_id, contact_id, nickname)
     VALUES ($1, $2, $3)
     ON CONFLICT (owner_id, contact_id)
     DO UPDATE SET nickname = EXCLUDED.nickname
     RETURNING *`,
    [ownerId, contactId, nickname]
  );
  return result.rows[0];
}

async function clearNickname(ownerId, contactId) {
  await query('DELETE FROM contact_nicknames WHERE owner_id = $1 AND contact_id = $2', [ownerId, contactId]);
}

async function getNickname(ownerId, contactId) {
  const result = await query(
    'SELECT nickname FROM contact_nicknames WHERE owner_id = $1 AND contact_id = $2',
    [ownerId, contactId]
  );
  return result.rows[0]?.nickname || null;
}

/** Returns a Map<contactId, nickname> for every nickname this owner has set. Used to bulk-apply overrides. */
async function getNicknameMapForOwner(ownerId) {
  const result = await query('SELECT contact_id, nickname FROM contact_nicknames WHERE owner_id = $1', [ownerId]);
  const map = new Map();
  for (const row of result.rows) {
    map.set(Number(row.contact_id), row.nickname);
  }
  return map;
}

module.exports = { setNickname, clearNickname, getNickname, getNicknameMapForOwner };
