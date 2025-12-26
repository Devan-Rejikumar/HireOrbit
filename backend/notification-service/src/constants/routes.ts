/**
 * Notification Service Route Constants
 * All route paths for the notification service are defined here
 */

export const NOTIFICATION_ROUTES = {
  // Base API path
  API_BASE_PATH: '/api/notifications',
  
  // Notification query routes
  GET_NOTIFICATIONS: '/:recipientId',
  GET_NOTIFICATIONS_PAGINATED: '/:recipientId/paginated',
  GET_UNREAD_COUNT: '/:recipientId/unread-count',
  
  // Notification update routes
  MARK_ALL_AS_READ: '/:recipientId/mark-all-read',
  MARK_AS_READ: '/:notificationId/read',
  MARK_AS_UNREAD: '/:notificationId/unread',
  
  // Notification delete routes
  DELETE_NOTIFICATION: '/:notificationId',
} as const;

