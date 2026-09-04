import rateLimit from 'express-rate-limit';

// Strict login rate limiter: 5 attempts per 15 minutes per IP to prevent brute force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

// Public lead submission limiter: 10 per 15 minutes per IP
export const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many inquiries from this IP, please try again later.',
  },
});

// Newsletter subscription limiter: 5 per 15 minutes per IP to prevent spam
export const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many newsletter subscription attempts from this IP, please try again later.',
    code: 'RATE_LIMITED',
  },
});

// General API rate limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
