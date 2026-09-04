import express from 'express';
import {
  handleCreateLead,
  handleGetLeads,
  handleGetLeadById,
  handleUpdateLeadStatus,
  handleUpdateLead,
  handleDeleteLead,
  handleGetLeadStats,
} from '../controllers/lead.controller.js';
import { validateRequest, validateObjectId } from '../middlewares/validate.middleware.js';
import { validateLeadInput } from '../validations/lead.validation.js';
import { leadLimiter } from '../middlewares/rateLimiter.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public: Lead creation (from frontend funnels, rate-limited and validated)
router.post('/', leadLimiter, validateRequest(validateLeadInput), handleCreateLead);

// Protected Admin Endpoints (Require valid JWT Bearer Token)
router.get('/stats', requireAuth, handleGetLeadStats);
router.get('/', requireAuth, handleGetLeads);
router.get('/:id', requireAuth, validateObjectId('id'), handleGetLeadById);
router.put('/:id', requireAuth, validateObjectId('id'), handleUpdateLead);
router.patch('/:id', requireAuth, validateObjectId('id'), handleUpdateLead);
router.patch('/:id/status', requireAuth, validateObjectId('id'), handleUpdateLeadStatus);
router.delete('/:id', requireAuth, validateObjectId('id'), handleDeleteLead);

export default router;
