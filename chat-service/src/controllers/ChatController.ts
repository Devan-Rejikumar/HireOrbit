import { Response } from 'express';
import { injectable, inject } from 'inversify';
import { IChatService } from '../services/interfaces/IChatService';
import { TYPES } from '../config/types';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AuthenticatedRequest } from '../types/request';
import { getMessagesSchema } from '../dto/schemas/chat.schema';

@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.IChatService) private chatService: IChatService
  ) {}

  async getUserConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false,
          error: 'User ID is required' 
        });
        return;
      }
      
      const conversations = await this.chatService.getUserConversations(userId);
      res.status(HttpStatusCode.OK).json({ 
        success: true, 
        data: { conversations } 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  async getCompanyConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.params.companyId || req.user?.companyId;
      if (!companyId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false,
          error: 'Company ID is required' 
        });
        return;
      }
      
      const conversations = await this.chatService.getCompanyConversations(companyId);
      res.status(HttpStatusCode.OK).json({ 
        success: true, 
        data: { conversations } 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.userId || req.user?.companyId;
      
      const conversation = await this.chatService.getConversation(conversationId, userId);
      if (!conversation) {
        res.status(HttpStatusCode.NOT_FOUND).json({ 
          success: false, 
          error: 'Conversation not found' 
        });
        return;
      }
      
      res.status(HttpStatusCode.OK).json({ success: true, data: conversation });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('access')) {
        res.status(HttpStatusCode.FORBIDDEN).json({ 
          success: false, 
          error: errorMessage 
        });
        return;
      }
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  async getConversationByApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { applicationId } = req.params;
      
      console.log('🔍 [ChatController] Getting conversation for application:', applicationId);
      
      // Extract auth headers from request to forward to application service
      const authHeaders: Record<string, string> = {};
      if (req.user?.userId) {
        authHeaders['x-user-id'] = req.user.userId;
      }
      if (req.user?.role) {
        authHeaders['x-user-role'] = req.user.role;
      }
      if (req.headers.authorization) {
        authHeaders['Authorization'] = req.headers.authorization as string;
      }
      
      // Forward cookies if present (for cookie-based authentication)
      if (req.headers.cookie) {
        authHeaders['Cookie'] = req.headers.cookie as string;
        console.log('🍪 [ChatController] Forwarding cookies to application service');
      }
      
      // Get application details to extract userId and companyId
      const applicationDetails = await this.chatService.getApplicationDetails(
        applicationId,
        authHeaders
      );
      
      console.log('✅ [ChatController] Application details:', applicationDetails);
      
      // First, check if there's already a conversation between this user and company
      // This ensures one conversation per company, not per application
      let conversation = await this.chatService.getConversationByUserAndCompany(
        applicationDetails.userId,
        applicationDetails.companyId
      );
      
      // If conversation exists, return it (reuse existing conversation)
      if (conversation) {
        console.log('✅ [ChatController] Found existing conversation between user and company:', conversation.id);
        res.status(HttpStatusCode.OK).json({ success: true, data: conversation });
        return;
      }
      
      // If no conversation exists, create one
      // This will also check internally, but we already checked above
      console.log('📝 [ChatController] No existing conversation found, creating new one...');
      conversation = await this.chatService.createConversationFromApplication(
        applicationId,
        applicationDetails.userId,
        applicationDetails.companyId
      );
      
      console.log('✅ [ChatController] Conversation created:', conversation.id);
      res.status(HttpStatusCode.OK).json({ success: true, data: conversation });
    } catch (error) {
      console.error('❌ [ChatController] Error in getConversationByApplication:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate query params with Zod
      const validationResult = getMessagesSchema.safeParse({
        conversationId: req.params.conversationId,
        limit: req.query.limit,
        skip: req.query.skip
      });

      if (!validationResult.success) {
        const errorDetails = validationResult.error.issues.map(issue => issue.message).join(', ');
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: 'Validation failed',
          details: errorDetails
        });
        return;
      }

      const { conversationId, limit, skip } = validationResult.data;
      const messages = await this.chatService.getMessages(conversationId, limit, skip);
      res.status(HttpStatusCode.OK).json({ 
        success: true, 
        data: { messages } 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      
      // Try to get userId from req.user first (from headers via middleware)
      let userId = req.user?.userId || req.user?.companyId;
      
      // Fallback: try to get from request body (if frontend sends it)
      if (!userId && req.body?.userId) {
        userId = req.body.userId;
        console.log('📝 [ChatController] Using userId from request body:', userId);
      }
      
      // Last resort: try to get from headers directly (in case middleware didn't run)
      if (!userId) {
        const headerUserId = req.headers['x-user-id'] as string;
        if (headerUserId) {
          userId = headerUserId;
          console.log('📝 [ChatController] Using userId from headers:', userId);
        }
      }
      
      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false,
          error: 'User ID is required. Please provide userId in request body or ensure authentication headers are set.' 
        });
        return;
      }
      
      await this.chatService.markAsRead(conversationId, userId);
      res.status(HttpStatusCode.OK).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.userId || req.user?.companyId;
      
      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false,
          error: 'User ID is required' 
        });
        return;
      }
      
      const count = await this.chatService.getUnreadCount(conversationId, userId);
      res.status(HttpStatusCode.OK).json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  async getTotalUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.companyId || req.params.userId;
      
      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false,
          error: 'User ID is required' 
        });
        return;
      }
      
      const count = await this.chatService.getTotalUnreadCount(userId);
      res.status(HttpStatusCode.OK).json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  async getConversationsWithUnread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.companyId || req.params.userId;
      
      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false,
          error: 'User ID is required' 
        });
        return;
      }
      
      const conversations = await this.chatService.getConversationsWithUnread(userId);
      res.status(HttpStatusCode.OK).json({ success: true, data: { conversations } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }
}