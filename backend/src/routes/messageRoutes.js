const express = require('express');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { sendMessageSchema } = require('../validators/messageValidator');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/:chatId', messageController.getMessages);
router.post('/', validate(sendMessageSchema), messageController.sendMessage);
router.get('/:id/info', messageController.getMessageInfo);
router.delete('/chat/:chatId/clear', messageController.clearChat);
router.delete('/:id', messageController.deleteMessage);
router.post('/upload', upload.single('file'), messageController.uploadFile);

module.exports = router;
