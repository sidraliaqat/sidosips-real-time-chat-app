require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const logger = require('./utils/logger');
const { testConnection } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { registerChatSocket } = require('./sockets/chatSocket');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

registerChatSocket(io);

// Make `io` reachable from REST controllers (e.g. POST /api/messages -> emit new_message)
app.set('io', io);

async function start() {
  try {
    await testConnection();
    logger.info('PostgreSQL connected successfully');
  } catch (err) {
    logger.error(
      'Could not connect to PostgreSQL. Check your .env DB_* variables and that PostgreSQL is running. ' +
        `Details: ${err.message}`
    );
    process.exit(1);
  }

  await connectRedis();

  server.listen(PORT, () => {
    logger.info(`sidosips backend listening on http://localhost:${PORT}`);
    logger.info(`Accepting client connections from ${CLIENT_URL}`);
  });
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection:', err);
});

start();
