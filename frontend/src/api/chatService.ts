import axios from 'axios';
import { ENV } from '../config/env';
import { HTTP_STATUS } from '../constants/statusCodes';
import { API_ROUTES } from '../constants/apiRoutes';

// Create a separate axios instance for chat service
const chatApi = axios.create({
  baseURL: `${ENV.CHAT_SERVICE_URL}/api/chat`,
  withCredentials: true,
});

// Add auth token interceptor
chatApi.interceptors.request.use(
  (config) => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;
    
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (!(config.data instanceof FormData)) {
      config.headers = config.headers ?? {};
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

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
    const response = await chatApi.get<ConversationListResponse>(
      API_ROUTES.CHAT.USER_CONVERSATIONS(userId),
    );
    return response.data.data.conversations;
  },

  getCompanyConversations: async (companyId: string): Promise<ConversationResponse[]> => {
    const response = await chatApi.get<ConversationListResponse>(
      API_ROUTES.CHAT.COMPANY_CONVERSATIONS(companyId),
    );
    return response.data.data.conversations;
  },

  getConversation: async (conversationId: string): Promise<ConversationResponse> => {
    const response = await chatApi.get<ConversationResponseData>(
      API_ROUTES.CHAT.CONVERSATION(conversationId),
    );
    return response.data.data;
  },

  getConversationByApplication: async (applicationId: string): Promise<ConversationResponse | null> => {
    try {
      const response = await chatApi.get<ConversationResponseData>(
        API_ROUTES.CHAT.CONVERSATION_BY_APPLICATION(applicationId),
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
    const response = await chatApi.get<MessageListResponse>(
      API_ROUTES.CHAT.MESSAGES(conversationId),
      {
        params: { limit, skip },
      },
    );
    return response.data.data.messages;
  },

  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    await chatApi.post(API_ROUTES.CHAT.MARK_AS_READ(conversationId), {
      userId,
    });
  },

  getUnreadCount: async (conversationId: string, userId: string): Promise<number> => {
    const response = await chatApi.get<UnreadCountResponse>(
      API_ROUTES.CHAT.UNREAD_COUNT(conversationId),
      {
        params: { userId },
      },
    );
    return response.data.data.unreadCount;
  },

  getTotalUnreadCount: async (userId: string): Promise<number> => {
    const response = await chatApi.get<UnreadCountResponse>(
      API_ROUTES.CHAT.TOTAL_UNREAD_COUNT(userId),
    );
    return response.data.data.unreadCount;
  },

  getConversationsWithUnread: async (userId: string): Promise<ConversationResponse[]> => {
    const response = await chatApi.get<ConversationListResponse>(
      API_ROUTES.CHAT.CONVERSATIONS_WITH_UNREAD(userId),
    );
    return response.data.data.conversations;
  },
};

