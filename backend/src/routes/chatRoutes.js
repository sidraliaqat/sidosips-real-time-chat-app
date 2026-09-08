const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createPrivateChatSchema,
  createGroupChatSchema,
  addMemberSchema,
  updateGroupSchema,
} = require('../validators/chatValidator');

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createPrivateChatSchema), chatController.createPrivateChat);
router.post('/group', validate(createGroupChatSchema), chatController.createGroupChat);
router.get('/', chatController.getChats);
router.get('/:id', chatController.getChatById);
router.delete('/:id', chatController.deleteChat);
router.put('/:id', validate(updateGroupSchema), chatController.updateGroup);
router.post('/:id/members', validate(addMemberSchema), chatController.addMember);
router.delete('/:id/members/:userId', chatController.removeMember);
router.post('/:id/leave', chatController.leaveGroup);

module.exports = router;
