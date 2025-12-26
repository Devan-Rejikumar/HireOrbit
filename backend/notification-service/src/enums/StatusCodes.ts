export enum StatusCodes {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

// Alias for consistency with other services
export const HttpStatusCode = StatusCodes;

export enum ErrorMessages {
  NOTIFICATION_RETRIEVAL_FAILED = 'Failed to retrieve notifications',
  UNREAD_COUNT_RETRIEVAL_FAILED = 'Failed to retrieve unread count',
  MARK_AS_READ_FAILED = 'Failed to mark notification as read',
  MARK_AS_UNREAD_FAILED = 'Failed to mark notification as unread',
  MARK_ALL_AS_READ_FAILED = 'Failed to mark all notifications as read',
  DELETE_NOTIFICATION_FAILED = 'Failed to delete notification'
}

export enum SuccessMessages {
  NOTIFICATIONS_RETRIEVED = 'Notifications retrieved successfully',
  UNREAD_COUNT_RETRIEVED = 'Unread count retrieved successfully',
  NOTIFICATION_MARKED_AS_READ = 'Notification marked as read',
  NOTIFICATIONS_MARKED_AS_READ = 'All notifications marked as read',
  NOTIFICATION_MARKED_AS_UNREAD = 'Notification marked as unread',
  NOTIFICATION_DELETED = 'Notification deleted successfully'
}