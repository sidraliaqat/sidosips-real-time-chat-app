const { query } = require('../config/db');

async function create({ name, email, passwordHash }) {
  const result = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, profile_image, is_online, last_seen, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

async function findByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const result = await query('SELECT * FROM users WHERE id = ANY($1::bigint[])', [ids]);
  return result.rows;
}

async function search({ search = '', excludeUserId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const searchTerm = `%${search.toLowerCase()}%`;

  const result = await query(
    `SELECT id, name, email, profile_image, is_online, last_seen, created_at
     FROM users
     WHERE id <> $1
       AND (LOWER(name) LIKE $2 OR LOWER(email) LIKE $2)
     ORDER BY name ASC
     LIMIT $3 OFFSET $4`,
    [excludeUserId, searchTerm, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM users
     WHERE id <> $1 AND (LOWER(name) LIKE $2 OR LOWER(email) LIKE $2)`,
    [excludeUserId, searchTerm]
  );

  return { rows: result.rows, total: countResult.rows[0].total };
}

async function updateProfile(id, { name, profileImage }) {
  const result = await query(
    `UPDATE users
     SET name = COALESCE($2, name),
         profile_image = COALESCE($3, profile_image)
     WHERE id = $1
     RETURNING id, name, email, profile_image, is_online, last_seen, created_at, updated_at`,
    [id, name ?? null, profileImage ?? null]
  );
  return result.rows[0];
}

async function setOnlineStatus(id, isOnline) {
  const result = await query(
    `UPDATE users
     SET is_online = $2, last_seen = CASE WHEN $2 = FALSE THEN NOW() ELSE last_seen END
     WHERE id = $1
     RETURNING id, name, email, profile_image, is_online, last_seen`,
    [id, isOnline]
  );
  return result.rows[0];
}

module.exports = {
  create,
  findByEmail,
  findById,
  findByIds,
  search,
  updateProfile,
  setOnlineStatus,
};
