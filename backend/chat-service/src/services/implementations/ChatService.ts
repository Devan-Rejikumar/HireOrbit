import { injectable, inject } from 'inversify';
import axios, { AxiosRequestConfig } from 'axios';
import { IChatService } from '../interfaces/IChatService';
import { IChatRepository } from '../../repositories/interfaces/IChatRepository';
import { TYPES } from '../../config/types';
import { AppConfig } from '../../config/app.config';
import { ChatResponseMapper, ConversationResponse, MessageResponse } from '../../dto/responses/chat.response';
import { logger } from '../../utils/logger';

@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject(TYPES.IChatRepository) private _chatRepository: IChatRepository,
  ) {}
  async getApplicationDetails(applicationId: string, authHeaders?: Record<string, string>): Promise<{ userId: string; companyId: string; status: string }> {
    try {      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authHeaders,
      };

      if (authHeaders?.Authorization) {
        logger.info('Auth header present', { 
          headerPreview: authHeaders.Authorization.substring(0, 20) + '...' 
        });
      } else {
        logger.warn('No Authorization header found in authHeaders');
      }
      
      const axiosConfig: AxiosRequestConfig = { 
        headers,
        ...(headers.Cookie && { withCredentials: true }),
      };
      
      // Use APPLICATION_SERVICE_URL directly instead of going through API gateway
      // This avoids network issues in Docker and is more efficient
      // APPLICATION_SERVICE_URL is already set correctly (http://application-service:3004 in Docker)
      const url = `${AppConfig.services.applicationServiceUrl
}/api/applications/${applicationId}`;
      logger.info('Fetching application details', { 
        applicationId, 
        url,
        headers: Object.keys(headers),
        serviceUrl: AppConfig.services.applicationServiceUrl
,
      });
      
      const response = await axios.get(url, axiosConfig);
      
      logger.info('Application fetch response received', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
      });
      
      const applicationData = response.data?.data || response.data;
      
      logger.info('Extracted application data', {
        hasData: !!applicationData,
        hasUserId: !!applicationData?.userId,
        hasCompanyId: !!applicationData?.companyId,
        userId: applicationData?.userId,
        companyId: applicationData?.companyId,
      });
      
      if (!applicationData || !applicationData.userId || !applicationData.companyId) {
        logger.error('Invalid application data structure', {
          applicationData,
          responseData: response.data,
        });
        throw new Error('Invalid application data received: missing userId or companyId');
      }
      
      return {
        userId: applicationData.userId,
        companyId: applicationData.companyId,
        status: applicationData.status || 'PENDING',
      };
    } catch (error: unknown) {
      // Extract detailed error information from axios errors
      let errorMessage = 'Unknown error';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const responseData = error.response.data;
          errorMessage = `HTTP ${error.response.status}: ${
            responseData?.message || 
            responseData?.error?.message ||
            responseData?.error ||
            error.response.statusText || 
            'Request failed'
          }`;
          
          logger.error('Axios error - Response error', {
            status: error.response.status,
            statusText: error.response.statusText,
            responseData,
            url: error.config?.url,
            method: error.config?.method,
          });
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = `No response from server: ${error.message || error.code || 'Network error'}`;
          logger.error('Axios error - No response', {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            method: error.config?.method,
            stack: error.stack,
          });
        } else {
          // Error setting up request
          errorMessage = `Request setup failed: ${error.message || 'Unknown error'}`;
          logger.error('Axios error - Setup failed', {
            message: error.message,
            stack: error.stack,
          });
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        logger.error('Standard error while fetching application details', {
          message: error.message,
          stack: error.stack,
        });
      } else {
        logger.error('Unknown error type while fetching application details', {
          error: JSON.stringify(error),
        });
      }
      
      logger.error('Failed to fetch application details', {
        applicationId,
        errorMessage,
        errorType: axios.isAxiosError(error) ? 'AxiosError' : error instanceof Error ? 'Error' : 'Unknown',
      });
      
      throw new Error(`Failed to fetch application details: ${errorMessage}`);
    }
  }

  async createConversationFromApplication(
    applicationId: string,
    userId: string,
    companyId: string,
  ): Promise<ConversationResponse> {
    const existingConversation = await this._chatRepository.findConversationByUserAndCompany(userId, companyId);
    if (existingConversation) {
      return ChatResponseMapper.toConversationResponse(existingConversation);
    }
    const conversation = await this._chatRepository.createConversation(applicationId, userId, companyId);
    return ChatResponseMapper.toConversationResponse(conversation);
  }

  async getConversationByUserAndCompany(
    userId: string,
    companyId: string,
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
    userId?: string,
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
    messageType: 'text' | 'image' | 'file' = 'text',
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
      timestamp: new Date(),
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
    skip: number = 0,
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