# sidosips — Socket.IO Event Reference

Connect with: `io(SOCKET_URL, { auth: { token: '<JWT>' } })`

If the token is missing, invalid, or expired, the server rejects the
connection with a socket `connect_error` (`AUTH_REQUIRED`, `INVALID_TOKEN`,
or `TOKEN_EXPIRED`).

## Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_chat` | `{ chatId }` (ack callback) | Joins the Socket.IO room for a chat. Also marks any of your unseen incoming messages as `delivered`. |
| `leave_chat` | `{ chatId }` | Leaves the chat's room. |
| `send_message` | `{ chatId, content, messageType, fileUrl?, fileName? }` (ack callback) | Persists a message and broadcasts it to the chat room. |
| `typing` | `{ chatId }` | Broadcasts that you started typing. |
| `stop_typing` | `{ chatId }` | Broadcasts that you stopped typing. |
| `message_read` | `{ chatId }` (ack callback) | Marks all of your unread messages in the chat as read and notifies the sender(s). |

## Server → Client

| Event | Payload | Description |
|---|---|---|
| `new_message` | `{ message }` | A new message was sent in a chat you're in. |
| `message_delivered` | `{ chatId, messageIds }` | One or more of your sent messages were delivered to a recipient. |
| `message_read` | `{ chatId, userId, messageIds }` | A participant read one or more messages. |
| `typing` | `{ chatId, userId, userName }` | Someone started typing. |
| `stop_typing` | `{ chatId, userId }` | Someone stopped typing. |
| `user_online` | `{ userId }` | A user came online (broadcast to everyone). |
| `user_offline` | `{ userId, lastSeen }` | A user went offline. |
| `notification` | notification object | A new notification for you (new message, group invite, etc). |
| `chat_updated` | `{ chat }` | A chat/group's details or membership changed. |
| `member_left` | `{ chatId, userId }` | A member left a group. |
| `message_deleted` | `{ chatId, messageId }` | A message was deleted. |
| `chat_cleared` | `{ chatId }` | All messages in a chat were cleared. |
| `error` | `{ message }` | Sent once, right before the server forcibly disconnects a socket (e.g. account no longer exists). |

All server → client events are scoped to Socket.IO rooms: `chat:<chatId>`
for chat-specific events, and `user:<userId>` for direct-to-user pushes
like notifications.
