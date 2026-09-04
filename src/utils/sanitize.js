import mongoose from 'mongoose';

/**
 * Escapes special characters for regular expressions to prevent ReDoS (Regular Expression Denial of Service)
 * and syntax injection errors.
 *
 * @param {string} str - Raw input string
 * @returns {string} Escaped string safe for RegExp constructor
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Strips ASCII/Unicode control characters (except common whitespace),
 * trims leading/trailing whitespace, and truncates to max length.
 *
 * @param {any} value - Input value
 * @param {number} maxChars - Maximum allowable length
 * @returns {string} Cleaned string
 */
export const cleanString = (value, maxChars = 200) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, ' ')
    .trim()
    .slice(0, maxChars);
};

/**
 * Checks if a value is a valid MongoDB 24-character hexadecimal ObjectId.
 *
 * @param {any} id - Value to check
 * @returns {boolean} True if valid 24-char hex ObjectId
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Checks if an input is a primitive safe string (prevents NoSQL injection like object queries { $ne: null }).
 *
 * @param {any} val - Value to check
 * @returns {boolean} True if primitive string
 */
export const isSafeString = (val) => {
  return typeof val === 'string';
};
