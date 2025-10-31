import { Router } from 'express';
import { container } from '../config/inversify.config';
import { NotificationController } from '../controllers/NotificationController';
import { TYPES } from '../config/types';

const router = Router();
const notificationController = container.get<NotificationController>(TYPES.INotificationService);

router.get('/:recipientId', (req, res) => notificationController.getNotifications(req, res));
router.get('/:recipientId/paginated', (req, res) => notificationController.getNotificationsPaginated(req, res));
router.get('/:recipientId/unread-count', (req, res) => notificationController.getUnreadCount(req, res));
router.patch('/:notificationId/read', (req, res) => notificationController.markAsRead(req, res));
router.patch('/:notificationId/unread', (req, res) => notificationController.markAsUnread(req, res));
router.delete('/:notificationId', (req, res) => notificationController.deleteNotification(req, res));

export default router;