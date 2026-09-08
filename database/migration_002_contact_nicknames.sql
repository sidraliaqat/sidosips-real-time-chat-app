-- ============================================================
-- sidosips — Migration 002: contact nicknames
--
-- Run this ONLY if you already set up your database before this
-- update. It adds one new table without touching your existing
-- users/chats/messages — nothing is dropped, no data is lost.
--
--   psql -U postgres -d sidosips -f database/migration_002_contact_nicknames.sql
--
-- (If you are setting up sidosips fresh, you don't need this file —
-- schema.sql already includes this table.)
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_nicknames (
  id          BIGSERIAL PRIMARY KEY,
  owner_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname    VARCHAR(50) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_contact_nicknames UNIQUE (owner_id, contact_id),
  CONSTRAINT chk_contact_nicknames_not_self CHECK (owner_id <> contact_id),
  CONSTRAINT chk_contact_nicknames_length CHECK (char_length(trim(nickname)) BETWEEN 1 AND 50)
);

CREATE INDEX IF NOT EXISTS idx_contact_nicknames_owner ON contact_nicknames (owner_id);

DROP TRIGGER IF EXISTS trg_contact_nicknames_updated_at ON contact_nicknames;
CREATE TRIGGER trg_contact_nicknames_updated_at
BEFORE UPDATE ON contact_nicknames
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
