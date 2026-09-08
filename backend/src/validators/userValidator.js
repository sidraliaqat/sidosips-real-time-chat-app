const Joi = require('joi');
const { nameSchema } = require('./authValidator');

const updateProfileSchema = Joi.object({
  name: nameSchema.optional(),
  profileImage: Joi.string().allow('', null).optional(),
}).min(1);

const searchUsersSchema = Joi.object({
  search: Joi.string().trim().allow('').max(100).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const nicknameSchema = Joi.object({
  nickname: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Nickname cannot be empty',
    'string.max': 'Nickname must be 50 characters or fewer',
  }),
});

module.exports = { updateProfileSchema, searchUsersSchema, nicknameSchema };
