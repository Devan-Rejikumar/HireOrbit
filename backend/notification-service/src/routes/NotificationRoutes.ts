import { Router } from 'express';
import { container } from '../config/inversify.config';
import { NotificationController } from '../controllers/NotificationController';
import { TYPES } from '../config/types';
import { NOTIFICATION_ROUTES } from '../constants/routes';

const router = Router();
const notificationController = container.get<NotificationController>(TYPES.INotificationController);

router.get(NOTIFICATION_ROUTES.GET_NOTIFICATIONS, async (req, res) => {
  await notificationController.getNotifications(req, res);
});
router.get(NOTIFICATION_ROUTES.GET_NOTIFICATIONS_PAGINATED, async (req, res) => {
  await notificationController.getNotificationsPaginated(req, res);
});
router.get(NOTIFICATION_ROUTES.GET_UNREAD_COUNT, async (req, res) => {
  await notificationController.getUnreadCount(req, res);
});
router.patch(NOTIFICATION_ROUTES.MARK_ALL_AS_READ, async (req, res) => {
  await notificationController.markAllAsRead(req, res);
});
router.patch(NOTIFICATION_ROUTES.MARK_AS_READ, async (req, res) => {
  await notificationController.markAsRead(req, res);
});
router.patch(NOTIFICATION_ROUTES.MARK_AS_UNREAD, async (req, res) => {
  await notificationController.markAsUnread(req, res);
});
router.delete(NOTIFICATION_ROUTES.DELETE_NOTIFICATION, async (req, res) => {
  await notificationController.deleteNotification(req, res);
});

export default router;