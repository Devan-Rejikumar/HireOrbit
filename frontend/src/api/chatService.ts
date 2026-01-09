import api from './axios';
import { ENV } from '../config/env';
import { HTTP_STATUS } from '../constants/statusCodes';
import { API_ROUTES } from '../constants/apiRoutes';

const CHAT_API_BASE_URL = ENV.API_BASE_URL;

export interface ConversationResponse {
  id: string;
  applicationId: string;
  userId: string;
  companyId: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  unreadCount: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationListResponse {
  success: boolean;
  data: {
    conversations: ConversationResponse[];
  };
}

export interface ConversationResponseData {
  success: boolean;
  data: ConversationResponse;
}

export interface MessageListResponse {
  success: boolean;
  data: {
    messages: MessageResponse[];
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export const _chatService = {
  getUserConversations: async (userId: string): Promise<ConversationResponse[]> => {
    const response = await api.get<ConversationListResponse>(
      `${CHAT_API_BASE_URL}${API_ROUTES.CHAT.USER_CONVERSATIONS(userId)}`,
    );
    return response.data.data.conversations;
  },

  getCompanyConversations: async (companyId: string): Promise<ConversationResponse[]> => {
    const response = await api.get<ConversationListResponse>(
      `${CHAT_API_BASE_URL}${API_ROUTES.CHAT.COMPANY_CONVERSATIONS(companyId)}`,
    );
    return response.data.data.conversations;
  },

  getConversation: async (conversationId: string): Promise<ConversationResponse> => {
    const response = await api.get<ConversationResponseData>(
      `${CHAT_API_BASE_URL}${API_ROUTES.CHAT.CONVERSATION(conversationId)}`,
    );
    return response.data.data;
  },

  getConversationByApplication: async (applicationId: string): Promise<ConversationResponse | null> => {
    try {
      const response = await api.get<ConversationResponseData>(
        `${CHAT_API_BASE_URL}${API_ROUTES.CHAT.CONVERSATION_BY_APPLICATION(applicationId)}`,
      );
      return response.data.data;
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { status?: number; data?: unknown } }) : null;
      if (axiosError && (axiosError.response?.status === HTTP_STATUS.NOT_FOUND || axiosError.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR)) {
        return null;
      }
      throw error;
    }
  },

  getMessages: async (
    conversationId: string,
    limit?: number,
    skip?: number,
  ): Promise<MessageResponse[]> => {
    const response = await api.get<MessageListResponse>(
      `${CHAT_API_BASE_URL}${API_ROUTES.CHAT.MESSAGES(conversationId)}`,
      {
        params: { limit, skip },
      },
    );
    return response.data.data.messages;
  },

  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    await api.post(`${CHAT_API_BASE_URL}${API_ROUTES.CHAT.MARK_AS_READ(conversationId)}`, {
      userId,
    });
  },

  getUnreadCount: async (conversationId: string, userId: string): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(
      `${CHAT_API_BASE_URL}${API_ROUTES.CHAT.UNREAD_COUNT(conversationId)}`,
      {
        params: { userId },
      },
    );
    return response.data.data.unreadCount;
  },

  getTotalUnreadCount: async (userId: string): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(
      `${CHAT_API_BASE_URL}${API_ROUTES.CHAT.TOTAL_UNREAD_COUNT(userId)}`,
    );
    return response.data.data.unreadCount;
  },

  getConversationsWithUnread: async (userId: string): Promise<ConversationResponse[]> => {
    const response = await api.get<ConversationListResponse>(
      `${CHAT_API_BASE_URL}${API_ROUTES.CHAT.CONVERSATIONS_WITH_UNREAD(userId)}`,
    );
    return response.data.data.conversations;
  },
};

