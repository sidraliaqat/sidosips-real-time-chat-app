-- ============================================================
-- sidosips — PostgreSQL Schema
-- Run this against an empty database, e.g.:
--   psql -U postgres -d sidosips -f database/schema.sql
-- ============================================================

-- Needed for gen_random_uuid() if ever used; safe to keep even if unused
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Auto-update "updated_at" trigger function (shared by all tables)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS contact_nicknames CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS message_reads CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(50) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  profile_image   TEXT,
  is_online       BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_users_name_length CHECK (char_length(name) BETWEEN 2 AND 50),
  CONSTRAINT chk_users_name_no_numbers CHECK (name !~ '[0-9]'),
  CONSTRAINT chk_users_email_lowercase CHECK (email = LOWER(email)),
  CONSTRAINT chk_users_email_gmail CHECK (email ~ '^[A-Za-z0-9._%+-]+@gmail\.com$')
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_name ON users (name);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- chats
-- ------------------------------------------------------------
CREATE TABLE chats (
  id          BIGSERIAL PRIMARY KEY,
  type        VARCHAR(10) NOT NULL,
  name        VARCHAR(100),
  image       TEXT,
  created_by  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_chats_type CHECK (type IN ('private', 'group')),
  CONSTRAINT chk_chats_group_name CHECK (
    (type = 'private') OR (type = 'group' AND name IS NOT NULL AND char_length(name) > 0)
  )
);

CREATE TRIGGER trg_chats_updated_at
BEFORE UPDATE ON chats
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- chat_participants
-- ------------------------------------------------------------
CREATE TABLE chat_participants (
  id          BIGSERIAL PRIMARY KEY,
  chat_id     BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_chat_participants UNIQUE (chat_id, user_id)
);

CREATE INDEX idx_chat_participants_chat_id ON chat_participants (chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants (user_id);

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
CREATE TABLE messages (
  id            BIGSERIAL PRIMARY KEY,
  chat_id       BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT,
  message_type  VARCHAR(10) NOT NULL DEFAULT 'text',
  file_url      TEXT,
  file_name     TEXT,
  status        VARCHAR(10) NOT NULL DEFAULT 'sent',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_messages_type CHECK (message_type IN ('text', 'image', 'file')),
  CONSTRAINT chk_messages_status CHECK (status IN ('sent', 'delivered', 'read')),
  CONSTRAINT chk_messages_text_content CHECK (
    (message_type <> 'text') OR (content IS NOT NULL AND char_length(trim(content)) > 0)
  ),
  CONSTRAINT chk_messages_text_length CHECK (content IS NULL OR char_length(content) <= 5000),
  CONSTRAINT chk_messages_file_url CHECK (
    (message_type = 'text') OR (message_type IN ('image', 'file') AND file_url IS NOT NULL)
  )
);

CREATE INDEX idx_messages_chat_id ON messages (chat_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_messages_created_at ON messages (created_at);

CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- message_reads
-- ------------------------------------------------------------
CREATE TABLE message_reads (
  id          BIGSERIAL PRIMARY KEY,
  message_id  BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_message_reads UNIQUE (message_id, user_id)
);

CREATE INDEX idx_message_reads_message_id ON message_reads (message_id);
CREATE INDEX idx_message_reads_user_id ON message_reads (user_id);

-- ------------------------------------------------------------
-- blocked_users (private-chat "Block user" feature)
-- ------------------------------------------------------------
CREATE TABLE blocked_users (
  id          BIGSERIAL PRIMARY KEY,
  blocker_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_blocked_users UNIQUE (blocker_id, blocked_id),
  CONSTRAINT chk_blocked_users_not_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users (blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users (blocked_id);

-- ------------------------------------------------------------
-- contact_nicknames ("rename a contact" feature — private to the owner)
-- ------------------------------------------------------------
CREATE TABLE contact_nicknames (
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

CREATE INDEX idx_contact_nicknames_owner ON contact_nicknames (owner_id);

CREATE TRIGGER trg_contact_nicknames_updated_at
BEFORE UPDATE ON contact_nicknames
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
  chat_id     BIGINT REFERENCES chats(id) ON DELETE CASCADE,
  message_id  BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL,
  content     TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_notifications_type CHECK (
    type IN ('new_message', 'group_invite', 'group_message', 'mention')
  )
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);

-- ------------------------------------------------------------
-- Done
-- ------------------------------------------------------------
