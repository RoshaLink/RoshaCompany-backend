import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const handleLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 'Username and password are required', 400);
    }

    const result = await authService.login(username, password);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    if (error.message.includes('Invalid username or password')) {
      return errorResponse(res, error.message, 401);
    }
    next(error);
  }
};

export const handleGetMe = async (req, res, next) => {
  try {
    return successResponse(res, req.user, 'Current user profile');
  } catch (error) {
    next(error);
  }
};

export const handleChangePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);
    return successResponse(res, result, 'Password updated successfully');
  } catch (error) {
    if (
      error.message.includes('Current password') ||
      error.message.includes('New password') ||
      error.message.includes('required') ||
      error.message.includes('identical')
    ) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

