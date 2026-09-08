const logger = require('../utils/logger');

/** 404 handler for unmatched routes. */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
}

/**
 * Centralized error handler. Every thrown/next(err) call lands here.
 * Never leaks raw database or stack trace details to the client.
 */
function errorHandler(err, req, res, next) {
  logger.error(err.message, process.env.NODE_ENV !== 'production' ? err.stack : '');

  // Known "AppError" style errors carry their own status code.
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';
  let errors = err.errors || [];

  // Postgres unique violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'This record already exists.';
  }
  // Postgres foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Related record does not exist.';
  }
  // Postgres check constraint violation
  if (err.code === '23514') {
    statusCode = 422;
    message = 'The submitted data did not pass validation.';
  }
  // Multer file-size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File is too large.';
  }

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error.';
  }

  res.status(statusCode).json({ success: false, message, errors });
}

/** Small helper for throwing errors with an HTTP status code attached. */
class AppError extends Error {
  constructor(message, statusCode = 400, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = { notFoundHandler, errorHandler, AppError };
