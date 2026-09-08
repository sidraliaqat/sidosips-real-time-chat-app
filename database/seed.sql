-- ============================================================
-- sidosips — Sample seed data (optional)
-- Run AFTER schema.sql:
--   psql -U postgres -d sidosips -f database/seed.sql
--
-- All sample users share the password:  Password123
-- (hashed below with bcrypt, 10 salt rounds)
-- ============================================================

INSERT INTO users (name, email, password_hash, is_online) VALUES
  ('Sidra',  'sidra@gmail.com',  '$2b$10$qtx/GTQ0acypAQDXw/RWQ.1Yyxmsjs5JaEkNZVhhEveTPUZ75avby', FALSE),
  ('Ahmad',  'ahmad@gmail.com',  '$2b$10$qtx/GTQ0acypAQDXw/RWQ.1Yyxmsjs5JaEkNZVhhEveTPUZ75avby', FALSE),
  ('Ayesha', 'ayesha@gmail.com', '$2b$10$qtx/GTQ0acypAQDXw/RWQ.1Yyxmsjs5JaEkNZVhhEveTPUZ75avby', FALSE),
  ('Sara',   'sara@gmail.com',   '$2b$10$qtx/GTQ0acypAQDXw/RWQ.1Yyxmsjs5JaEkNZVhhEveTPUZ75avby', FALSE),
  ('Ali',    'ali@gmail.com',    '$2b$10$qtx/GTQ0acypAQDXw/RWQ.1Yyxmsjs5JaEkNZVhhEveTPUZ75avby', FALSE);

-- Private chat: Sidra <-> Ahmad
INSERT INTO chats (type, created_by) VALUES ('private', (SELECT id FROM users WHERE email = 'sidra@gmail.com'));
INSERT INTO chat_participants (chat_id, user_id, is_admin)
  SELECT c.id, u.id, TRUE FROM chats c, users u
  WHERE c.type = 'private' AND c.created_by = u.id
  AND c.id = (SELECT MAX(id) FROM chats);
INSERT INTO chat_participants (chat_id, user_id, is_admin)
  SELECT (SELECT MAX(id) FROM chats), id, FALSE FROM users WHERE email = 'ahmad@gmail.com';

INSERT INTO messages (chat_id, sender_id, content, message_type, status)
  SELECT (SELECT MAX(id) FROM chats), u.id, 'Hey Ahmad! Welcome to sidosips 👋', 'text', 'sent'
  FROM users u WHERE u.email = 'sidra@gmail.com';
INSERT INTO messages (chat_id, sender_id, content, message_type, status)
  SELECT (SELECT MAX(id) FROM chats), u.id, 'Hey Sidra! Glad to be here.', 'text', 'sent'
  FROM users u WHERE u.email = 'ahmad@gmail.com';

-- Group chat: "Coffee Crew" — Sidra (admin), Ahmad, Ayesha, Sara
INSERT INTO chats (type, name, created_by)
  SELECT 'group', 'Coffee Crew', id FROM users WHERE email = 'sidra@gmail.com';

INSERT INTO chat_participants (chat_id, user_id, is_admin)
  SELECT (SELECT MAX(id) FROM chats), id, TRUE FROM users WHERE email = 'sidra@gmail.com';
INSERT INTO chat_participants (chat_id, user_id, is_admin)
  SELECT (SELECT MAX(id) FROM chats), id, FALSE FROM users WHERE email = 'ahmad@gmail.com';
INSERT INTO chat_participants (chat_id, user_id, is_admin)
  SELECT (SELECT MAX(id) FROM chats), id, FALSE FROM users WHERE email = 'ayesha@gmail.com';
INSERT INTO chat_participants (chat_id, user_id, is_admin)
  SELECT (SELECT MAX(id) FROM chats), id, FALSE FROM users WHERE email = 'sara@gmail.com';

INSERT INTO messages (chat_id, sender_id, content, message_type, status)
  SELECT (SELECT MAX(id) FROM chats), id, 'Welcome to the Coffee Crew group ☕', 'text', 'sent'
  FROM users WHERE email = 'sidra@gmail.com';
INSERT INTO messages (chat_id, sender_id, content, message_type, status)
  SELECT (SELECT MAX(id) FROM chats), id, 'Excited to be here!', 'text', 'sent'
  FROM users WHERE email = 'ayesha@gmail.com';

-- ============================================================
-- Sample login credentials for testing:
--   sidra@gmail.com  / Password123
--   ahmad@gmail.com  / Password123
--   ayesha@gmail.com / Password123
--   sara@gmail.com   / Password123
--   ali@gmail.com    / Password123
-- ============================================================
