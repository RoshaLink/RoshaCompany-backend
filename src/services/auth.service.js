import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const INITIAL_ADMINS = [
  { username: 'bella', displayName: 'Bella', password: 'letsdoit', role: 'superadmin' },
  { username: 'milad', displayName: 'Milad', password: 'letsdoit', role: 'admin' },
  { username: 'morteza', displayName: 'Morteza', password: 'letsdoit', role: 'admin' },
  { username: 'sohrab', displayName: 'Sohrab', password: 'letsdoit', role: 'admin' },
  { username: 'mina', displayName: 'Mina', password: 'letsdoit', role: 'admin' },
];

/**
 * Idempotently seeds the 5 required admin accounts into MongoDB.
 */
export const seedDefaultAdmins = async () => {
  try {
    for (const admin of INITIAL_ADMINS) {
      const exists = await User.findOne({ username: admin.username });
      if (!exists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(admin.password, salt);

        await User.create({
          username: admin.username,
          displayName: admin.displayName,
          password: hashedPassword,
          role: admin.role,
        });

        logger.info(`Seeded initial admin account: [${admin.username}]`);
      }
    }
  } catch (error) {
    logger.error('Error during admin seeding:', error.message);
  }
};

/**
 * Validates admin credentials and generates a signed JWT.
 */
export const login = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const user = await User.findOne({ username: cleanUsername });

  if (!user) {
    throw new Error('Invalid username or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid username or password.');
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  // Generate signed JWT
  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );

  return {
    user: {
      id: user._id,
      username: user.username,
      displayName: user.displayName || user.username,
      role: user.role,
      lastLogin: user.lastLogin,
    },
    token,
  };
};

/**
 * Retrieves the current authenticated user's profile.
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password');
  return user;
};

/**
 * Changes an authenticated user's password securely.
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new Error('Current password and new password are required.');
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User account not found.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect.');
  }

  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new Error('New password cannot be identical to your current password.');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  logger.info(`Password successfully changed for user [${user.username}]`);

  return { success: true, message: 'Password successfully changed.' };
};

