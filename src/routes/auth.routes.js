import express from 'express';
import { handleLogin, handleGetMe, handleChangePassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Public: Login with strict brute force rate limiter
router.post('/login', loginLimiter, handleLogin);

// Protected: Get current user profile
router.get('/me', requireAuth, handleGetMe);

// Protected: Change password securely
router.patch('/change-password', requireAuth, handleChangePassword);

export default router;
