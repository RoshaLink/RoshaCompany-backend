/**
 * Newsletter validation & sanitization rules with anti-bot honeypot check.
 */

const MAX_EMAIL_CHARS = 254;

function cleanString(value, maxChars) {
  if (typeof value !== 'string') return '';
  // Strip control characters and trim
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxChars);
}

function looksLikeEmail(value) {
  if (typeof value !== 'string') return false;
  // RFC 5322 compliant practical regex
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
    value.trim()
  );
}

export const validateNewsletterInput = (body) => {
  const errors = [];

  // 1. Anti-Bot Honeypot Trap: legitimate users never fill these hidden fields
  const honeypot = body?.hp_field || body?.website_url || body?.bot_check;
  if (honeypot && String(honeypot).trim().length > 0) {
    // Flag as spam bot submission
    return {
      isValid: false,
      isBot: true,
      errors: ['Invalid submission detected.'],
      sanitizedData: null,
    };
  }

  // 2. Clean and normalize email
  const rawEmail = cleanString(body?.email, MAX_EMAIL_CHARS).toLowerCase();
  const lang = cleanString(body?.lang, 10) || 'sv';
  const source = cleanString(body?.source, 50) || 'footer-newsletter';

  if (!rawEmail) {
    errors.push('Email is required.');
  } else if (!looksLikeEmail(rawEmail)) {
    errors.push('A valid email address is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      email: rawEmail,
      lang,
      source,
    },
  };
};
