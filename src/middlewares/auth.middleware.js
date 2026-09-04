import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import { User } from '../models/User.model.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Authentication required. Malformed token.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Session expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid authentication token.', 401);
    }

    // Attach user to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User account no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
