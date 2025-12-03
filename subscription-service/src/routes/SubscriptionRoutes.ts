import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { asyncHandler } from '../utils/asyncHandler';
import { extractUserFromHeaders, requireAuth } from '../middleware/auth.middleware';

const router = Router();
const subscriptionController = container.get<SubscriptionController>(TYPES.SubscriptionController);

// Apply user extraction middleware to all routes (populates req.user if headers exist)
router.use(extractUserFromHeaders);

// Get available plans (public - no auth required)
router.get('/plans', subscriptionController.getPlans);

// Protected routes (require authentication)
// Get subscription status
router.get('/status', requireAuth, subscriptionController.getSubscriptionStatus);

// Create subscription
router.post('/', requireAuth, subscriptionController.createSubscription);

// Cancel subscription
router.post('/:subscriptionId/cancel', requireAuth, subscriptionController.cancelSubscription);

// Upgrade subscription
router.post('/:subscriptionId/upgrade', requireAuth, subscriptionController.upgradeSubscription);

// Check job posting limit (for companies)
router.get('/limits/job-posting', requireAuth, subscriptionController.checkJobPostingLimit);

// Check feature access
router.get('/features/:featureName', requireAuth, subscriptionController.checkFeatureAccess);

export default router;

