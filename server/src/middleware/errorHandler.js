import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorType = err.name || 'ServerError';
  let details = err.details || null;

  // Handle Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid resource ID format: ${err.value}`;
    errorType = 'InvalidId';
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    message = `A record with ${duplicatedField} "${duplicatedValue}" already exists. Duplicate identifiers are not permitted.`;
    errorType = 'DuplicateKeyError';
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const validationErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = validationErrors[0]?.message || 'Database validation failed';
    errorType = 'ValidationError';
    details = validationErrors;
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token signature';
    errorType = 'Unauthorized';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
    errorType = 'TokenExpired';
  }

  // Log error in development/test
  if (config.env !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: errorType,
    message,
    ...(details ? { details } : {}),
    ...(config.env === 'development' ? { stack: err.stack } : {}),
  });
};
