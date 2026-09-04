import mongoose from 'mongoose';
import { successResponse } from '../utils/apiResponse.js';

export const handleHealthCheck = (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return successResponse(
    res,
    {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
    },
    'RoshaLink Backend API is healthy'
  );
};
