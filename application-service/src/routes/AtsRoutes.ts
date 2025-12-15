import express from 'express';
import { container } from '../config/inversify.config';
import { AtsController } from '../controllers/AtsController';
import { authenticateToken } from '../middleware/auth.middleware';
import { TYPES } from '../config/types';

const router = express.Router();
// Get AtsController from container (it will be injected with dependencies)
const atsController = container.get<AtsController>(TYPES.AtsController);

// POST /api/v1/ats/analyze
// Protected route - requires user to be logged in (and potentially subscribed)
// Now using JSON body with base64 encoded PDF instead of multipart/form-data
router.post(
  '/analyze',
  authenticateToken,
  atsController.analyzeResume
);

// POST /api/v1/ats/analyze-application/:applicationId
// Protected route - requires company authentication
// Analyzes resume against job description for a specific application
router.post(
  '/analyze-application/:applicationId',
  authenticateToken,
  atsController.analyzeApplicationResume
);

export default router;
