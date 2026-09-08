const userRepository = require('../repositories/userRepository');
const { toSafeUser, toSafeUserList } = require('../models/userModel');
const { AppError } = require('../middleware/errorMiddleware');
const presenceService = require('../services/presenceService');
const userService = require('../services/userService');

async function getUsers(req, res, next) {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const { rows, total } = await userRepository.search({
      search,
      excludeUserId: req.user.id,
      page: Number(page),
      limit: Number(limit),
    });

    const users = toSafeUserList(rows).map((u) => ({ ...u, isOnline: presenceService.isOnline(u.id) }));

    res.status(200).json({
      success: true,
      message: 'Users fetched',
      data: {
        users,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.max(1, Math.ceil(total / Number(limit))),
          totalItems: total,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userRepository.findById(req.params.id);
    if (!user) throw new AppError('User not found.', 404);
    const safe = toSafeUser(user);
    safe.isOnline = presenceService.isOnline(user.id);
    safe.isBlockedByMe = await userService.isBlockedByMe(req.user.id, user.id);
    await userService.applyNicknames(req.user.id, [safe]);
    res.status(200).json({ success: true, message: 'User fetched', data: { user: safe } });
  } catch (err) {
    next(err);
  }
}

async function blockUser(req, res, next) {
  try {
    await userService.blockUser(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'User blocked', data: {} });
  } catch (err) {
    next(err);
  }
}

async function unblockUser(req, res, next) {
  try {
    await userService.unblockUser(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'User unblocked', data: {} });
  } catch (err) {
    next(err);
  }
}

async function getBlockedUsers(req, res, next) {
  try {
    const rows = await userService.getBlockedUsers(req.user.id);
    const blockedUsers = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      profileImage: row.profile_image,
      blockedAt: row.blocked_at,
    }));
    res.status(200).json({ success: true, message: 'Blocked users fetched', data: { blockedUsers } });
  } catch (err) {
    next(err);
  }
}

async function setNickname(req, res, next) {
  try {
    const { nickname } = req.body;
    await userService.setNickname(req.user.id, req.params.id, nickname);
    res.status(200).json({ success: true, message: 'Nickname saved', data: {} });
  } catch (err) {
    next(err);
  }
}

async function clearNickname(req, res, next) {
  try {
    await userService.clearNickname(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Nickname removed', data: {} });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, profileImage } = req.body;
    const updated = await userRepository.updateProfile(req.user.id, { name, profileImage });
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: toSafeUser(updated) },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
  setNickname,
  clearNickname,
};
