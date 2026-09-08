const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { signToken } = require('../utils/jwt');
const { toSafeUser } = require('../models/userModel');
const { AppError } = require('../middleware/errorMiddleware');

async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.create({ name, email, passwordHash });

  const token = signToken({ userId: user.id });

  return { user: toSafeUser(user), token };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken({ userId: user.id });

  return { user: toSafeUser(user), token };
}

async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  return toSafeUser(user);
}

module.exports = { register, login, getCurrentUser };
