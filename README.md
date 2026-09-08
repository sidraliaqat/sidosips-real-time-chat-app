# sidosips

**Sip. Chat. Connect.**

sidosips is a full-stack, real-time messaging application: private chats, group
chats, typing indicators, online/offline presence, delivery & read receipts,
file/image sharing, and live notifications — built with React, Node.js,
Express, PostgreSQL, Socket.IO, and Redis.


---

## Features

- Email/password registration & login (Gmail addresses only) with Bcrypt password hashing
- JWT-protected REST APIs and JWT-protected Socket.IO connections
- Private (1:1) chats and group chats with an admin role
- Real-time messaging, typing indicators, online/offline presence, last seen
- Message delivery status (sent → delivered → read); in **group** chats a tick only
  turns "read" once **every** member has seen it, with a "Seen by X/Y" detail view
  showing exactly who has (and hasn't) read a message
- Image and file sharing with Multer, previewed inline in the chat
- Real-time in-app notifications with an unread badge
- User search, in-chat message search, group member management
- Mute chat notifications, clear chat history, block/unblock a user (with a
  dedicated "Blocked users" list in Profile to review and unblock anyone)
- **Contact nicknames** — rename how any user's name appears to you (chat list,
  chat header, message sender names) without affecting what they or anyone else sees
- Profile management (name, profile photo)
- A full-screen landing page (brand + Log In / Sign Up) instead of an auto-redirecting splash
- Paginated chat/message/notification history
- Centralized error handling, input validation (Joi), rate limiting, Helmet, CORS
- Fully responsive layout (desktop 3-pane, tablet 2-pane, mobile single-pane with back navigation)

## Tech stack

**Frontend:** React 18, Vite, React Router, Axios, Socket.IO client, plain CSS3
**Backend:** Node.js, Express, PostgreSQL (`pg`), Socket.IO, JWT, Bcrypt, Joi, Multer, Redis, Helmet, express-rate-limit

## Architecture

```
React (Vite SPA)  <---HTTP (REST)--->  Express API  <--->  PostgreSQL
       |                                    |
       '-----------Socket.IO (WS)-----------'
                                             |
                                          Redis (presence tracking)
```

- **REST API** handles auth, CRUD for users/chats/messages/notifications, and file uploads.
- **Socket.IO** handles everything that needs to happen live: new messages, typing,
  presence, delivery/read receipts, notifications.
- **PostgreSQL** is the single source of truth for all data.
- **Redis** mirrors the "who's online" set so presence can later scale across multiple
  server instances; the app runs correctly even if Redis is temporarily down (see
  [How Redis is used](#how-redis-is-used)).

## Folder structure

```
sidosips/
├── frontend/            React + Vite SPA
│   └── src/
│       ├── components/  Reusable UI building blocks
│       ├── pages/        Splash, Login, Register, ChatDashboard, Profile, NotFound
│       ├── layouts/      AuthLayout, MainLayout
│       ├── context/      AuthContext, ChatContext, ToastContext
│       ├── hooks/        useAuth, useChat, useSocket
│       ├── services/     axios wrappers per resource
│       ├── socket/       shared Socket.IO client
│       ├── utils/        validation, date formatting, token storage
│       └── styles/       plain CSS, one file per concern
├── backend/             Express + PostgreSQL + Socket.IO API
│   └── src/
│       ├── config/       db.js, redis.js
│       ├── controllers/  request handlers
│       ├── routes/       Express routers
│       ├── middleware/   auth, error, upload, validation, rate limiting
│       ├── models/       safe-output shaping (never leaks password_hash)
│       ├── repositories/ all parameterized SQL lives here
│       ├── services/     business logic
│       ├── validators/   Joi schemas
│       ├── sockets/      chatSocket.js — all Socket.IO event handlers
│       ├── constants/    enums (message types, chat types)
│       └── utils/        jwt.js, bcrypt.js, logger.js
│   ├── uploads/          uploaded images/files are stored here
│   ├── tests/            Node built-in test runner — validator unit tests
│   └── docs/             SOCKET_EVENTS.md — event contract reference
├── database/
│   ├── schema.sql        full DDL: tables, constraints, indexes, triggers
│   └── seed.sql          5 sample users + sample private/group chats
├── postman/
│   └── sidosips.postman_collection.json
└── .gitignore
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Redis 6+ (optional but recommended — see [Redis setup](#redis-setup))
- Git, VS Code, Postman (recommended tooling, not strictly required)

## PostgreSQL setup

1. Create the database:
   ```bash
   createdb sidosips
   # or, from the psql prompt:
   # CREATE DATABASE sidosips;
   ```
2. Run the schema:
   ```bash
   psql -U postgres -d sidosips -f database/schema.sql
   ```
3. (Optional) Load sample data — 5 users and a couple of sample chats:
   ```bash
   psql -U postgres -d sidosips -f database/seed.sql
   ```

> **Already set up sidosips before?** If you're updating an existing install
> rather than starting fresh, do **not** re-run `schema.sql` — it starts with
> `DROP TABLE`, which will delete all your existing users/chats/messages.
> Instead, just run the small incremental migration:
> ```bash
> psql -U postgres -d sidosips -f database/migration_002_contact_nicknames.sql
> ```
> This adds the one new table (`contact_nicknames`) needed for the nickname
> feature, without touching anything else.

You can do all of this visually in **pgAdmin** instead: create the `sidosips`
database, open the Query Tool, paste in `schema.sql` (then `seed.sql`), and execute.

## Redis setup

Redis is used for online-presence tracking. The app **runs without Redis**
(it prints a clear warning and falls back to in-memory-only presence for that
single process), but for the full experience, install and run it locally:

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install redis-server
sudo systemctl enable --now redis-server
```

**Windows:** use [Memurai](https://www.memurai.com/) or run Redis via WSL/Docker.

**Any OS with Docker:**
```bash
docker run -d --name sidosips-redis -p 6379:6379 redis:7
```

Verify it's running: `redis-cli ping` should reply `PONG`.

## Environment variables

Copy the example files and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

| Variable | Description | Example |
|---|---|---|
| `PORT` | API server port | `5000` |
| `CLIENT_URL` | Frontend origin, for CORS | `http://localhost:5173` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection | — |
| `JWT_SECRET` | Long random string used to sign tokens | — |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `UPLOAD_DIR` | Folder for uploaded files | `uploads` |
| `MAX_FILE_SIZE_MB` | Upload size limit | `10` |

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend REST API |
| `VITE_SOCKET_URL` | Base URL of the backend Socket.IO server |

## Installation & running

**1. Backend**
```bash
cd backend
npm install
npm run dev        # nodemon, auto-restarts on changes
# or: npm start
```
You should see `sidosips backend listening on http://localhost:5000`.

**2. Frontend** (in a second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the printed URL (default `http://localhost:5173`).

**3. Try it out**
- Register a new account (must be an `@gmail.com` address, password ≥ 8 characters), or
- Log in with one of the seeded accounts below.
- Open the app in two different browsers (or one normal + one incognito window)
  logged in as two different users to see real-time messaging, typing indicators,
  and presence in action.

## Sample login credentials

If you ran `database/seed.sql`, these accounts are ready to use
(all share the password **`Password123`**):

| Name | Email |
|---|---|
| Sidra | sidra@gmail.com |
| Ahmad | ahmad@gmail.com |
| Ayesha | ayesha@gmail.com |
| Sara | sara@gmail.com |
| Ali | ali@gmail.com |

## Testing the API with Postman

1. Import `postman/sidosips.postman_collection.json` into Postman.
2. Run **Auth → Login** first. Its test script automatically saves the returned
   JWT into the collection variable `{{token}}` (and your user id into `{{userId}}`),
   so every other request in the collection is authenticated automatically.
3. Explore the **Users**, **Chats**, **Messages**, and **Notifications** folders.
   A few requests (Create Private Chat, Send Message, etc.) auto-populate
   `{{chatId}}` / `{{messageId}}` from their own responses so you can run the
   collection top-to-bottom.
4. Protected routes require the header `Authorization: Bearer {{token}}` — already
   configured on every request in the collection.

> **Note:** Postman can exercise every REST endpoint above, but it cannot test
> real-time Socket.IO behavior (typing, live message delivery, presence). Use
> the actual React frontend (two browser windows/users) for that, or a
> Socket.IO-compatible client if you want to script it.

## How Socket.IO works here

- The client connects with `io(SOCKET_URL, { auth: { token } })`.
- A server-side `io.use()` middleware verifies the JWT **before** the connection
  is accepted — unauthenticated sockets are rejected outright.
- Each user joins a personal room `user:<id>` (for direct notifications) and a
  room `chat:<id>` for every chat they open (`join_chat`).
- Sending a message (`send_message`) saves it to PostgreSQL first, then
  broadcasts `new_message` to everyone in `chat:<id>` — including the sender's
  own other tabs.
- Typing, delivery, read receipts, and presence are all separate, focused
  events — see [`backend/docs/SOCKET_EVENTS.md`](backend/docs/SOCKET_EVENTS.md)
  for the full contract.

## How Redis is used

Redis mirrors the current "online users" set (`SADD`/`SREM` on a
`sidosips:online_users` key) every time a user's first/last socket
connects/disconnects. This is intentionally simple:

- The **source of truth for "is this user online right now"** is an
  in-memory Map inside the running Node process (fast, always accurate for a
  single instance).
- Redis is kept in sync alongside it so that, if you later run multiple
  backend instances behind a load balancer, they can all check the same
  shared "online" set (and you'd add the official `@socket.io/redis-adapter`
  for cross-instance broadcasting).
- If Redis isn't running, the app logs a clear warning and keeps working —
  presence just won't be shared across multiple server processes.

## How file uploads work

- `POST /api/messages/upload` accepts a single `multipart/form-data` file
  under the field name `file`.
- **Multer** validates the MIME type (images, PDF, Word, Excel, plain text,
  zip — no executables) and enforces a max size (`MAX_FILE_SIZE_MB`, default 10MB).
  Files are renamed to a random, collision-proof name and saved to `backend/uploads/`.
  Anything else is rejected with a 400.
- The endpoint returns a relative URL like `/uploads/171234-abcd.png`, which
  the frontend then attaches to a normal `send_message` call as `fileUrl`.
- Uploaded files are served statically at `GET /uploads/<filename>`.

## How authentication works

- **Register:** validates input (Joi) → checks for an existing email → hashes
  the password with Bcrypt (10 salt rounds) → inserts the user → returns a JWT.
  `password_hash` is never returned in any API response.
- **Login:** looks up the user by email → compares the password with Bcrypt →
  issues a JWT (`{ userId }`, signed with `JWT_SECRET`, expires per `JWT_EXPIRES_IN`).
- **Protected REST routes:** `authMiddleware` reads `Authorization: Bearer <token>`,
  verifies it, loads the user from PostgreSQL, and attaches it to `req.user`.
- **Protected sockets:** the same JWT is verified in a Socket.IO middleware
  before the connection handshake completes.
- **Frontend persistence:** the JWT is stored in `localStorage`; on every page
  load, the app calls `GET /api/auth/me` to confirm the token is still valid
  before restoring the session, and clears it (redirecting to `/login`) if not.

## Running backend tests

The backend includes unit tests for its Joi validators using Node's built-in
test runner (no extra test framework needed, no database required):

```bash
cd backend
npm test
```

## Known simplifications

In the interest of a clean, beginner-friendly, non-over-engineered codebase,
a few pragmatic choices were made:

- **CSS** is organized into a small number of shared stylesheets
  (`variables.css`, `base.css`, `components.css`, `chat.css`, `auth.css`,
  `profile.css`) rather than one CSS file per component. Class names are
  scoped by convention (e.g. `.msg-bubble`, `.sidebar-*`) to avoid collisions.
- **"Mute notifications"** is a genuine, working feature, but it's a
  per-browser preference stored in `localStorage` (like muting a thread on a
  phone) rather than a database column — there's no server-side concept of a
  muted chat.
- **"Clear chat"** permanently deletes all messages in that chat for **both**
  participants (there's no per-user "hidden before this point" pointer in the
  schema). This is disclosed in the confirmation dialog before it's used.
- Redis is used for straightforward online/offline set-tracking, not as a
  full Socket.IO adapter for horizontal scaling — see
  [How Redis is used](#how-redis-is-used) for exactly what it does and doesn't do.
- Message search (`?search=`) does a simple case-insensitive `LIKE` match; it
  is not a full-text search index.
- **Group avatar collage** (the auto-generated 2x2 photo grid shown for groups
  without a custom photo) appears in the chat header and group info panel,
  where full member data is already loaded. The sidebar chat list still shows
  a plain initial for such groups, since that list is intentionally a
  lightweight summary query that doesn't fetch every group's member list.
- **Contact nicknames** are a private, one-directional preference: if you
  rename someone, only you see that name — it never changes what they, or
  anyone else, see for themselves or each other.

Nothing above is a stub or fake handler — every feature listed in
[Features](#features) is fully wired from the UI through the REST/Socket.IO
layer to PostgreSQL and actually works end-to-end.

## Future improvements

- `@socket.io/redis-adapter` for true multi-instance Socket.IO scaling
- Push notifications (web push / FCM) for when the tab isn't open
- Message reactions and replies/threads
- Full-text message search (PostgreSQL `tsvector` or a search service)
- Per-user "clear chat" (a `cleared_before` pointer instead of hard deletes)
- Automated end-to-end tests (Playwright/Cypress) alongside the existing validator unit tests
- Dockerfile/docker-compose for one-command local setup

## Screenshots

_Add screenshots of the splash screen, login, chat dashboard, and mobile view here._

---

Built with 💜 using the sidosips palette: English Violet `#4A3267`,
Blush `#DE638A`, Pink `#F7B9C4`, Mimi Pink `#F3D9E5`, Thistle `#C6BADE`.
