/**
 * Centralized message constants for Chat Service
 * All success and error messages used across controllers
 */
export const Messages = {
  CHAT: {
    CONVERSATIONS_RETRIEVED: 'Conversations retrieved successfully',
    CONVERSATION_RETRIEVED: 'Conversation retrieved successfully',
    MESSAGES_RETRIEVED: 'Messages retrieved successfully',
    MARKED_AS_READ: 'Messages marked as read',
    UNREAD_COUNT_RETRIEVED: 'Unread count retrieved successfully',
    TOTAL_UNREAD_COUNT_RETRIEVED: 'Total unread count retrieved successfully',
    CONVERSATIONS_WITH_UNREAD_RETRIEVED: 'Conversations with unread messages retrieved successfully',
    NOT_FOUND: 'Conversation not found',
    ACCESS_DENIED: 'Access denied to this conversation',
  },
  ERROR: {
    SOMETHING_WENT_WRONG: 'Something went wrong',
    VALIDATION_FAILED: 'Validation failed',
    USER_ID_REQUIRED: 'User ID is required',
    COMPANY_ID_REQUIRED: 'Company ID is required',
    CONVERSATION_NOT_FOUND: 'Conversation not found',
  },
} as const;

