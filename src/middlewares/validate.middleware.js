import { errorResponse } from '../utils/apiResponse.js';
import { isValidObjectId } from '../utils/sanitize.js';

export const validateRequest = (validator) => {
  return (req, res, next) => {
    const { isValid, errors, sanitizedData } = validator(req.body);

    if (!isValid) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    // Attach sanitized data to request
    req.sanitizedBody = sanitizedData;
    next();
  };
};

/**
 * Validates whether a route parameter conforms to a valid MongoDB ObjectId.
 * Prevents Mongoose CastError exceptions and protects database queries.
 *
 * @param {string} paramName - Name of the request param (defaults to 'id')
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !isValidObjectId(id)) {
      return errorResponse(
        res,
        `Invalid identifier format: "${id}". Expected a valid 24-character hex ID.`,
        400
      );
    }
    next();
  };
};

