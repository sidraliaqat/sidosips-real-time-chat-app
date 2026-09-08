const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { updateProfileSchema, nicknameSchema } = require('../validators/userValidator');

const router = express.Router();

router.use(authMiddleware);

router.get('/', userController.getUsers);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.get('/me/blocked', userController.getBlockedUsers);
router.get('/:id', userController.getUserById);
router.post('/:id/block', userController.blockUser);
router.delete('/:id/block', userController.unblockUser);
router.put('/:id/nickname', validate(nicknameSchema), userController.setNickname);
router.delete('/:id/nickname', userController.clearNickname);

module.exports = router;
