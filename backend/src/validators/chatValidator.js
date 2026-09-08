const Joi = require('joi');

const createPrivateChatSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});

const createGroupChatSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Group name is required',
  }),
  image: Joi.string().allow('', null).optional(),
  memberIds: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
    'array.min': 'Select at least one member to create a group',
  }),
});

const addMemberSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  image: Joi.string().allow('', null).optional(),
}).min(1);

module.exports = {
  createPrivateChatSchema,
  createGroupChatSchema,
  addMemberSchema,
  updateGroupSchema,
};
