const Joi = require('joi');

const sendMessageSchema = Joi.object({
  chatId: Joi.number().integer().positive().required(),
  content: Joi.string().max(5000).allow('', null).optional(),
  messageType: Joi.string().valid('text', 'image', 'file').default('text'),
  fileUrl: Joi.string().allow('', null).optional(),
  fileName: Joi.string().allow('', null).optional(),
}).custom((value, helpers) => {
  if (value.messageType === 'text') {
    if (!value.content || value.content.trim().length === 0) {
      return helpers.error('any.invalid', { message: 'Text messages cannot be empty' });
    }
  } else if (!value.fileUrl) {
    return helpers.error('any.invalid', { message: 'File/image messages require a file' });
  }
  return value;
});

const getMessagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().allow('').max(200).optional(),
});

module.exports = { sendMessageSchema, getMessagesQuerySchema };
