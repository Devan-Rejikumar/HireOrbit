import api from './axios';
const CHAT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const CHAT_API_PATH = '/chat';

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
      `${CHAT_API_BASE_URL}${CHAT_API_PATH}/users/${userId}/conversations`
    );
    return response.data.data.conversations;
  },

  getCompanyConversations: async (companyId: string): Promise<ConversationResponse[]> => {
    const response = await api.get<ConversationListResponse>(
      `${CHAT_API_BASE_URL}${CHAT_API_PATH}/companies/${companyId}/conversations`
    );
    return response.data.data.conversations;
  },

  getConversation: async (conversationId: string): Promise<ConversationResponse> => {
    const response = await api.get<ConversationResponseData>(
      `${CHAT_API_BASE_URL}${CHAT_API_PATH}/conversations/${conversationId}`
    );
    return response.data.data;
  },

  getConversationByApplication: async (applicationId: string): Promise<ConversationResponse | null> => {
    try {
      const response = await api.get<ConversationResponseData>(
        `${CHAT_API_BASE_URL}${CHAT_API_PATH}/conversations/application/${applicationId}`
      );
      return response.data.data;
    } catch (error: any) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: any } };
        // Handle 404 (not found) or 500 (creation failed) as "no conversation yet"
        if (axiosError.response?.status === 404 || axiosError.response?.status === 500) {
          console.warn(`⚠️ [ChatService] Conversation not found/created for ${applicationId}:`, axiosError.response?.data);
          return null;
        }
      }
      console.error(`❌ [ChatService] Unexpected error fetching conversation:`, error);
      throw error;
    }
  },

  getMessages: async (
    conversationId: string,
    limit?: number,
    skip?: number
  ): Promise<MessageResponse[]> => {
    const response = await api.get<MessageListResponse>(
      `${CHAT_API_BASE_URL}${CHAT_API_PATH}/conversations/${conversationId}/messages`,
      {
        params: { limit, skip }
      }
    );
    return response.data.data.messages;
  },

  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    await api.post(`${CHAT_API_BASE_URL}${CHAT_API_PATH}/conversations/${conversationId}/read`, {
      userId
    });
  },

  getUnreadCount: async (conversationId: string, userId: string): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(
      `${CHAT_API_BASE_URL}${CHAT_API_PATH}/conversations/${conversationId}/unread-count`,
      {
        params: { userId }
      }
    );
    return response.data.data.unreadCount;
  },

  getTotalUnreadCount: async (userId: string): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(
      `${CHAT_API_BASE_URL}${CHAT_API_PATH}/users/${userId}/total-unread-count`
    );
    return response.data.data.unreadCount;
  },

  getConversationsWithUnread: async (userId: string): Promise<ConversationResponse[]> => {
    const response = await api.get<ConversationListResponse>(
      `${CHAT_API_BASE_URL}${CHAT_API_PATH}/users/${userId}/conversations-with-unread`
    );
    return response.data.data.conversations;
  }
};

