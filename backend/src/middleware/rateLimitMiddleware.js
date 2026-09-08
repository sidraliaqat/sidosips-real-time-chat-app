const rateLimit = require('express-rate-limit');

/** General API limiter — generous, just to blunt abuse. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.', errors: [] },
});

/** Stricter limiter for auth endpoints to slow down brute force. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.', errors: [] },
});

module.exports = { apiLimiter, authLimiter };
