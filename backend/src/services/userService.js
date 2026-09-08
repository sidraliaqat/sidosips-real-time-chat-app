const blockRepository = require('../repositories/blockRepository');
const userRepository = require('../repositories/userRepository');
const contactNicknameRepository = require('../repositories/contactNicknameRepository');
const { AppError } = require('../middleware/errorMiddleware');

async function blockUser(currentUserId, targetUserId) {
  if (Number(currentUserId) === Number(targetUserId)) {
    throw new AppError('You cannot block yourself.', 400);
  }
  const targetUser = await userRepository.findById(targetUserId);
  if (!targetUser) throw new AppError('User not found.', 404);

  await blockRepository.block(currentUserId, targetUserId);
}

async function unblockUser(currentUserId, targetUserId) {
  await blockRepository.unblock(currentUserId, targetUserId);
}

async function isBlockedByMe(currentUserId, targetUserId) {
  return blockRepository.hasBlocked(currentUserId, targetUserId);
}

async function getBlockedUsers(currentUserId) {
  return blockRepository.listBlockedByUser(currentUserId);
}

async function setNickname(ownerId, contactId, nickname) {
  if (Number(ownerId) === Number(contactId)) {
    throw new AppError('You cannot set a nickname for yourself.', 400);
  }
  const contact = await userRepository.findById(contactId);
  if (!contact) throw new AppError('User not found.', 404);

  return contactNicknameRepository.setNickname(ownerId, contactId, nickname.trim());
}

async function clearNickname(ownerId, contactId) {
  await contactNicknameRepository.clearNickname(ownerId, contactId);
}

/**
 * Overrides `.name` on any object that has an `.id` matching a contact the
 * viewer has nicknamed, and preserves the original under `.realName`.
 * Mutates and returns the same array for convenience.
 */
async function applyNicknames(viewerId, people) {
  const nicknameMap = await contactNicknameRepository.getNicknameMapForOwner(viewerId);
  if (nicknameMap.size === 0) return people;

  for (const person of people) {
    if (!person || person.id === undefined || person.id === null) continue;
    const nickname = nicknameMap.get(Number(person.id));
    if (nickname) {
      person.realName = person.name;
      person.name = nickname;
      person.nickname = nickname;
    }
  }
  return people;
}

module.exports = {
  blockUser,
  unblockUser,
  isBlockedByMe,
  getBlockedUsers,
  setNickname,
  clearNickname,
  applyNicknames,
};
