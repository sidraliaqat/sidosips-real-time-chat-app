const Joi = require('joi');

// Name: 2-50 chars, letters/spaces/hyphens/apostrophes only (no digits).
const nameSchema = Joi.string()
  .trim()
  .min(2)
  .max(50)
  .pattern(/^[^\d]+$/)
  .messages({
    'string.pattern.base': 'Name must not contain numbers',
    'string.min': 'Name must be between 2 and 50 characters',
    'string.max': 'Name must be between 2 and 50 characters',
    'string.empty': 'Name is required',
  });

// Email: must be a lowercase @gmail.com address.
const emailSchema = Joi.string()
  .trim()
  .lowercase()
  .pattern(/^[A-Za-z0-9._%+-]+@gmail\.com$/)
  .messages({
    'string.pattern.base': 'Email must be a valid @gmail.com address',
    'string.empty': 'Email is required',
  });

const passwordSchema = Joi.string().min(8).max(100).messages({
  'string.min': 'Password must be at least 8 characters',
  'string.empty': 'Password is required',
});

const registerSchema = Joi.object({
  name: nameSchema.required(),
  email: emailSchema.required(),
  password: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().required().messages({ 'string.empty': 'Password is required' }),
});

module.exports = { registerSchema, loginSchema, nameSchema, emailSchema, passwordSchema };
