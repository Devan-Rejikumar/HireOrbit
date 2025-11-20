import { Router } from 'express';
import { container } from '../config/inversify.config';
import { NotificationController } from '../controllers/NotificationController';
import { TYPES } from '../config/types';

const router = Router();
const notificationController = container.get<NotificationController>(TYPES.INotificationController);

router.get('/:recipientId', async (req, res) => {
  await notificationController.getNotifications(req, res);
});
router.get('/:recipientId/paginated', async (req, res) => {
  await notificationController.getNotificationsPaginated(req, res);
});
router.get('/:recipientId/unread-count', async (req, res) => {
  await notificationController.getUnreadCount(req, res);
});
router.patch('/:recipientId/mark-all-read', async (req, res) => {
  await notificationController.markAllAsRead(req, res);
});
router.patch('/:notificationId/read', async (req, res) => {
  await notificationController.markAsRead(req, res);
});
router.patch('/:notificationId/unread', async (req, res) => {
  await notificationController.markAsUnread(req, res);
});
router.delete('/:notificationId', async (req, res) => {
  await notificationController.deleteNotification(req, res);
});

export default router;