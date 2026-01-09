import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { extractUserFromHeaders, requireAuth } from '../middleware/auth.middleware';

const router = Router();
const subscriptionController = container.get<SubscriptionController>(TYPES.SubscriptionController);

router.use(extractUserFromHeaders);

router.get('/plans', subscriptionController.getPlans);
router.get('/status', requireAuth, subscriptionController.getSubscriptionStatus);
router.post('/', requireAuth, subscriptionController.createSubscription);
router.post('/:subscriptionId/cancel', requireAuth, subscriptionController.cancelSubscription);
router.post('/:subscriptionId/upgrade', requireAuth, subscriptionController.upgradeSubscription);
router.get('/limits/job-posting', requireAuth, subscriptionController.checkJobPostingLimit);
router.get('/features/:featureName', requireAuth, subscriptionController.checkFeatureAccess);
router.post('/increment-job-count', requireAuth, subscriptionController.incrementJobPostingCount);

export default router;

