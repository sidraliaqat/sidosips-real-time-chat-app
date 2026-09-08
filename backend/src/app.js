const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const { UPLOAD_DIR } = require('./middleware/uploadMiddleware');

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow <img> to load uploaded files
  })
);
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

// Serve uploaded files (images/documents) statically.
app.use('/uploads', express.static(path.join(__dirname, '..', UPLOAD_DIR)));

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'sidosips API is running', data: {} });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
