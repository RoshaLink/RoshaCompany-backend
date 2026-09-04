import express from 'express';
import healthRoutes from './health.routes.js';
import leadRoutes from './lead.routes.js';
import authRoutes from './auth.routes.js';
import newsletterRoutes from './newsletter.routes.js';

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Both /lead and /leads to ensure complete compatibility
router.use('/lead', leadRoutes);
router.use('/leads', leadRoutes);

// Newsletter subscribers routes
router.use('/newsletter', newsletterRoutes);

export default router;
