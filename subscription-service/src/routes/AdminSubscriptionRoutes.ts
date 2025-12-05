import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { AdminSubscriptionController } from '../controllers/AdminSubscriptionController';
import { AdminRevenueController } from '../controllers/AdminRevenueController';
import { extractUserFromHeaders, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
const adminSubscriptionController = container.get<AdminSubscriptionController>(TYPES.AdminSubscriptionController);
const adminRevenueController = container.get<AdminRevenueController>(TYPES.AdminRevenueController);


router.use(extractUserFromHeaders);

router.use(requireAdmin);


router.get('/plans', adminSubscriptionController.getAllPlans);
router.get('/plans/:id', adminSubscriptionController.getPlanById);
router.post('/plans', adminSubscriptionController.createPlan);
router.put('/plans/:id', adminSubscriptionController.updatePlan);
router.patch('/plans/:id/price', adminSubscriptionController.updatePlanPrice);
router.delete('/plans/:id', adminSubscriptionController.deletePlan);
router.get('/discounts', adminSubscriptionController.getAllDiscounts);
router.get('/discounts/plan/:planId', adminSubscriptionController.getDiscountsByPlan);
router.post('/discounts', adminSubscriptionController.createDiscount);
router.put('/discounts/:id', adminSubscriptionController.updateDiscount);
router.delete('/discounts/:id', adminSubscriptionController.deleteDiscount);
router.get('/revenue', adminRevenueController.getRevenueStatistics);
router.get('/transactions', adminRevenueController.getTransactionHistory);
router.post('/transactions/sync', adminRevenueController.syncTransactions);

export default router;

