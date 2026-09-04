import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/apiResponse.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  logger.error(`[Error Handler] ${req.method} ${req.originalUrl} - ${err.message}`, err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = config.isProduction ? undefined : [err.stack];

  // 1. Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field "${err.path}". Expected valid identifier.`;
  }

  // 2. Mongoose Schema Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    if (err.errors) {
      errors = Object.values(err.errors).map((e) => e.message);
    }
  }

  // 3. MongoDB Duplicate Key Error (Code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const duplicatedFields = Object.keys(err.keyValue || {});
    const fieldName = duplicatedFields.length > 0 ? duplicatedFields.join(', ') : 'field';
    message = `A record with this ${fieldName} already exists.`;
  }

  // 4. JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // 5. CORS Rejections
  else if (err.isCors || (typeof err.message === 'string' && err.message.includes('CORS'))) {
    statusCode = 403;
    message = 'Origin not allowed by CORS policy.';
  }

  // 6. Prevent internal implementation leakage in production for 500s
  if (statusCode === 500 && config.isProduction) {
    message = 'An unexpected internal server error occurred.';
    errors = undefined;
  }

  return errorResponse(res, message, statusCode, errors);
};

