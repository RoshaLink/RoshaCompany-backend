/**
 * Lead validation & sanitization rules.
 */

const MAX_FIELD_CHARS = 200;
const MAX_MESSAGE_CHARS = 4000;

function cleanString(value, maxChars) {
  if (typeof value !== 'string') return '';
  // Strip control characters
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxChars);
}

function normalizeDigits(str) {
  return str
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikeEmailOrPhone(value) {
  if (typeof value !== 'string') return false;
  const raw = value.trim();
  if (!raw) return false;

  // Accept valid emails or inputs containing an email address
  if (looksLikeEmail(raw) || /[^\s@]+@[^\s@]+\.[^\s@]+/.test(raw)) {
    return true;
  }

  // Normalize Persian and Arabic digits to ASCII digits
  const normalized = normalizeDigits(raw);
  const digitsOnly = normalized.replace(/\D/g, '');

  // Accept phone numbers with at least 5 digits
  if (digitsOnly.length >= 5 && digitsOnly.length <= 25) {
    return true;
  }

  return false;
}

export const validateLeadInput = (body) => {
  const errors = [];

  const name = cleanString(body?.name, MAX_FIELD_CHARS);
  const email = cleanString(body?.email || body?.contact, MAX_FIELD_CHARS);
  const company = cleanString(body?.company, MAX_FIELD_CHARS);
  const service = cleanString(body?.service, MAX_FIELD_CHARS);
  const budget = cleanString(body?.budget, MAX_FIELD_CHARS);
  const message = cleanString(body?.message || body?.details, MAX_MESSAGE_CHARS);
  const lang = cleanString(body?.lang, 10) || 'sv';
  const source = cleanString(body?.source, 50) || 'connect-with-us';

  if (!name || name.length < 2) {
    errors.push('Name is required and must be at least 2 characters.');
  }

  if (!email || !looksLikeEmailOrPhone(email)) {
    errors.push('A valid email address or phone number is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      name,
      email,
      company,
      service,
      budget,
      message,
      lang,
      source,
    },
  };
};
