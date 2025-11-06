import { injectable, inject } from 'inversify';
import axios from 'axios';
import { IChatService } from '../interfaces/IChatService';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository';
import { TYPES } from '../../config/types';
import { ChatResponseMapper, ConversationResponse, MessageResponse } from '../../dto/responses/chat.response';

@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject(TYPES.IChatRepository) private _chatRepository: IChatRepository
  ) {}
  async getApplicationDetails(
    applicationId: string,
    authHeaders?: Record<string, string>
  ): Promise<{ userId: string; companyId: string; status: string }> {
    try {
      // Use API Gateway URL instead of direct service URL to ensure authentication works
      // The API Gateway handles authentication and forwards requests to the application service
      const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:4000';
      
      console.log('📡 [ChatService] Fetching application details for:', applicationId);
      console.log('📡 [ChatService] Using API Gateway URL:', `${apiGatewayUrl}/api/applications/${applicationId}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authHeaders
      };
      
      // Log auth headers for debugging (without exposing sensitive data)
      if (authHeaders?.Authorization) {
        console.log('📡 [ChatService] Auth header present:', authHeaders.Authorization.substring(0, 20) + '...');
      } else {
        console.warn('⚠️ [ChatService] No Authorization header found in authHeaders');
      }
      
      // Forward cookies if present in headers
      const axiosConfig: any = { headers };
      if (headers.Cookie) {
        axiosConfig.withCredentials = true;
      }
      
      const response = await axios.get(
        `${apiGatewayUrl}/api/applications/${applicationId}`,
        axiosConfig
      );
      
      console.log('✅ [ChatService] Application details response:', response.data);
      
      // Handle different response structures
      const applicationData = response.data?.data || response.data;
      
      if (!applicationData || !applicationData.userId || !applicationData.companyId) {
        throw new Error('Invalid application data received');
      }
      
      return {
        userId: applicationData.userId,
        companyId: applicationData.companyId,
        status: applicationData.status || 'PENDING'
      };
    } catch (error: any) {
      console.error('❌ [ChatService] Error fetching application details:', error);
      console.error('❌ [ChatService] Error response:', error.response?.data);
      console.error('❌ [ChatService] Error status:', error.response?.status);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch application details: ${errorMessage}`);
    }
  }

  async createConversationFromApplication(
    applicationId: string,
    userId: string,
    companyId: string
  ): Promise<ConversationResponse> {
    // First, check if there's already a conversation between this user and company
    // This ensures one conversation per company, not per application
    const existingConversation = await this._chatRepository.findConversationByUserAndCompany(userId, companyId);
    if (existingConversation) {
      console.log(`✅ [ChatService] Reusing existing conversation ${existingConversation.id} for user ${userId} and company ${companyId}`);
      return ChatResponseMapper.toConversationResponse(existingConversation);
    }
    
    // If no conversation exists, create a new one
    // Note: We still store applicationId for reference, but lookup is by userId + companyId
    const conversation = await this._chatRepository.createConversation(applicationId, userId, companyId);
    console.log(`✅ [ChatService] Created new conversation ${conversation.id} for user ${userId} and company ${companyId}`);
    return ChatResponseMapper.toConversationResponse(conversation);
  }

  async getConversationByUserAndCompany(
    userId: string,
    companyId: string
  ): Promise<ConversationResponse | null> {
    const conversation = await this._chatRepository.findConversationByUserAndCompany(userId, companyId);
    return conversation ? ChatResponseMapper.toConversationResponse(conversation) : null;
  }

  async getUserConversations(userId: string): Promise<ConversationResponse[]> {
    const conversations = await this._chatRepository.getUserConversations(userId);
    return conversations.map(conv => ChatResponseMapper.toConversationResponse(conv));
  }

  async getCompanyConversations(companyId: string): Promise<ConversationResponse[]> {
    const conversations = await this._chatRepository.getCompanyConversations(companyId);
    return conversations.map(conv => ChatResponseMapper.toConversationResponse(conv));
  }

  async getConversation(
    conversationId: string,
    userId?: string
  ): Promise<ConversationResponse | null> {
    const conversation = await this._chatRepository.findConversationById(conversationId);
    if (conversation && userId && !conversation.participants.includes(userId)) {
      throw new Error('User does not have access to this conversation');
    }
    
    return conversation ? ChatResponseMapper.toConversationResponse(conversation) : null;
  }

  async getConversationByApplicationId(applicationId: string): Promise<ConversationResponse | null> {
    const conversation = await this._chatRepository.findConversationByApplicationId(applicationId);
    return conversation ? ChatResponseMapper.toConversationResponse(conversation) : null;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<MessageResponse> {
    const conversation = await this._chatRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    if (!conversation.participants.includes(senderId)) {
      throw new Error('Sender is not a participant in this conversation');
    }
    
    const message = await this._chatRepository.createMessage(conversationId, senderId, content, messageType);
    await this._chatRepository.updateConversationLastMessage(conversationId, {
      content,
      senderId,
      timestamp: new Date()
    });
    
    const otherParticipant = conversation.participants.find(id => id !== senderId);
    if (otherParticipant) {
      await this._chatRepository.incrementUnreadCount(conversationId, otherParticipant);
    }
    
    return ChatResponseMapper.toMessageResponse(message);
  }

  async getMessages(
    conversationId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<MessageResponse[]> {
    const messages = await this._chatRepository.getConversationMessages(conversationId, limit, skip);
    return messages.map(msg => ChatResponseMapper.toMessageResponse(msg));
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this._chatRepository.markMessageAsRead(conversationId, userId);
    await this._chatRepository.resetUnreadCount(conversationId, userId);
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    return await this._chatRepository.getUnreadMessageCount(conversationId, userId);
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    return await this._chatRepository.getTotalUnreadCount(userId);
  }

  async getConversationsWithUnread(userId: string): Promise<ConversationResponse[]> {
    const conversations = await this._chatRepository.getConversationsWithUnread(userId);
    return conversations.map(conv => ChatResponseMapper.toConversationResponse(conv));
  }
}