/**
 * Chat Service Route Constants
 * All route paths for the chat service are defined here
 */

export const CHAT_ROUTES = {
  API_BASE_PATH: '/api/chat',
  GET_USER_CONVERSATIONS: '/users/:userId/conversations',
  GET_USER_TOTAL_UNREAD_COUNT: '/users/:userId/total-unread-count',
  GET_USER_CONVERSATIONS_WITH_UNREAD: '/users/:userId/conversations-with-unread',
  GET_COMPANY_CONVERSATIONS: '/companies/:companyId/conversations',
  GET_CONVERSATION_BY_ID: '/conversations/:conversationId',
  GET_CONVERSATION_BY_APPLICATION: '/conversations/application/:applicationId',
  GET_MESSAGES: '/conversations/:conversationId/messages',
  MARK_AS_READ: '/conversations/:conversationId/read',
  GET_UNREAD_COUNT: '/conversations/:conversationId/unread-count',
} as const;

