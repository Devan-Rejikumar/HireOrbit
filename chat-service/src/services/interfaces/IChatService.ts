import { ConversationResponse, MessageResponse } from '../../dto/responses/chat.response';

export interface IChatService {
  createConversationFromApplication(
    applicationId: string,
    userId: string,
    companyId: string
  ): Promise<ConversationResponse>;
  
  getConversationByUserAndCompany(
    userId: string,
    companyId: string
  ): Promise<ConversationResponse | null>;
  
  getUserConversations(userId: string): Promise<ConversationResponse[]>;
  
  getCompanyConversations(companyId: string): Promise<ConversationResponse[]>;
  
  getConversation(
    conversationId: string,
    userId?: string
  ): Promise<ConversationResponse | null>;
  
  getConversationByApplicationId(
    applicationId: string
  ): Promise<ConversationResponse | null>;
  
  getApplicationDetails(
    applicationId: string,
    authHeaders?: Record<string, string>
  ): Promise<{ userId: string; companyId: string; status: string }>;
  
  sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType?: 'text' | 'image' | 'file'
  ): Promise<MessageResponse>;
  
  getMessages(
    conversationId: string,
    limit?: number,
    skip?: number
  ): Promise<MessageResponse[]>;
  
  markAsRead(conversationId: string, userId: string): Promise<void>;
  
  getUnreadCount(conversationId: string, userId: string): Promise<number>;
  
  getTotalUnreadCount(userId: string): Promise<number>;
  
  getConversationsWithUnread(userId: string): Promise<ConversationResponse[]>;
}