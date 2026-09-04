import express from 'express';
import { handleHealthCheck } from '../controllers/health.controller.js';

const router = express.Router();

router.get('/', handleHealthCheck);

export default router;
