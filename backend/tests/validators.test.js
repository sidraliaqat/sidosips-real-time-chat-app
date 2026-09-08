const test = require('node:test');
const assert = require('node:assert/strict');

const { registerSchema, loginSchema } = require('../src/validators/authValidator');
const { sendMessageSchema } = require('../src/validators/messageValidator');
const { createGroupChatSchema } = require('../src/validators/chatValidator');

test('registerSchema accepts a valid gmail registration', () => {
  const { error } = registerSchema.validate({
    name: 'Sidra Khan',
    email: 'sidra@gmail.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  });
  assert.equal(error, undefined);
});

test('registerSchema rejects a non-gmail email', () => {
  const { error } = registerSchema.validate({
    name: 'Sidra Khan',
    email: 'sidra@yahoo.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  });
  assert.ok(error, 'expected a validation error for a non-gmail address');
});

test('registerSchema rejects a name containing numbers', () => {
  const { error } = registerSchema.validate({
    name: 'Sidra123',
    email: 'sidra@gmail.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  });
  assert.ok(error, 'expected a validation error for a name containing digits');
});

test('registerSchema rejects mismatched passwords', () => {
  const { error } = registerSchema.validate({
    name: 'Sidra Khan',
    email: 'sidra@gmail.com',
    password: 'Password123',
    confirmPassword: 'Different123',
  });
  assert.ok(error, 'expected a validation error for mismatched passwords');
});

test('registerSchema rejects a password shorter than 8 characters', () => {
  const { error } = registerSchema.validate({
    name: 'Sidra Khan',
    email: 'sidra@gmail.com',
    password: 'Pass1',
    confirmPassword: 'Pass1',
  });
  assert.ok(error, 'expected a validation error for a short password');
});

test('loginSchema requires both email and password', () => {
  const { error } = loginSchema.validate({ email: 'sidra@gmail.com' });
  assert.ok(error, 'expected a validation error for a missing password');
});

test('sendMessageSchema rejects an empty text message', () => {
  const { error } = sendMessageSchema.validate({
    chatId: 1,
    content: '   ',
    messageType: 'text',
  });
  assert.ok(error, 'expected a validation error for empty text content');
});

test('sendMessageSchema accepts a valid image message without text content', () => {
  const { error } = sendMessageSchema.validate({
    chatId: 1,
    messageType: 'image',
    fileUrl: '/uploads/example.png',
    fileName: 'example.png',
  });
  assert.equal(error, undefined);
});

test('createGroupChatSchema requires at least one member', () => {
  const { error } = createGroupChatSchema.validate({
    name: 'Coffee Crew',
    memberIds: [],
  });
  assert.ok(error, 'expected a validation error for an empty member list');
});
