/**
 * Centralized message constants for Notification Service
 * All success and error messages used across controllers
 */
export const Messages = {
  NOTIFICATION: {
    RETRIEVED_SUCCESS: 'Notifications retrieved successfully',
    RETRIEVE_FAILED: 'Failed to retrieve notifications',
    UNREAD_COUNT_RETRIEVED: 'Unread count retrieved successfully',
    UNREAD_COUNT_FAILED: 'Failed to retrieve unread count',
    MARKED_AS_READ: 'Notification marked as read',
    MARK_AS_READ_FAILED: 'Failed to mark notification as read',
    MARKED_AS_UNREAD: 'Notification marked as unread',
    MARK_AS_UNREAD_FAILED: 'Failed to mark notification as unread',
    ALL_MARKED_AS_READ: 'All notifications marked as read',
    MARK_ALL_AS_READ_FAILED: 'Failed to mark all notifications as read',
    DELETED_SUCCESS: 'Notification deleted successfully',
    DELETE_FAILED: 'Failed to delete notification',
    NOT_FOUND: 'Notification not found',
  },
  ERROR: {
    SOMETHING_WENT_WRONG: 'Something went wrong',
    VALIDATION_FAILED: 'Validation failed',
  },
} as const;

