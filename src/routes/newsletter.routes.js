import express from 'express';
import {
  handleSubscribe,
  handleGetSubscribers,
  handleGetNewsletterStats,
  handleDeleteSubscriber,
  handleUpdateSubscriberStatus,
} from '../controllers/newsletter.controller.js';
import { validateRequest, validateObjectId } from '../middlewares/validate.middleware.js';
import { validateNewsletterInput } from '../validations/newsletter.validation.js';
import { newsletterLimiter } from '../middlewares/rateLimiter.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public: Subscribe to newsletter (Rate-limited, honeypot protected, input sanitized)
router.post('/', newsletterLimiter, validateRequest(validateNewsletterInput), handleSubscribe);

// Protected: Admin Management Endpoints (Require JWT Token)
router.get('/stats', requireAuth, handleGetNewsletterStats);
router.get('/', requireAuth, handleGetSubscribers);
router.patch('/:id/status', requireAuth, validateObjectId('id'), handleUpdateSubscriberStatus);
router.delete('/:id', requireAuth, validateObjectId('id'), handleDeleteSubscriber);

export default router;
