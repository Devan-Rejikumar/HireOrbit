import { Response } from 'express';
import { injectable, inject } from 'inversify';
import { IChatService } from '../services/interfaces/IChatService';
import { TYPES } from '../config/types';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AuthenticatedRequest } from '../types/request';
import { getMessagesSchema } from '../dto/schemas/chat.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { Messages } from '../constants/Messages';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.IChatService) private _chatService: IChatService,
  ) {}

  async getUserConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.params.userId || req.user?.userId;
    if (!userId) {
      throw new AppError(Messages.ERROR.USER_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    
    const conversations = await this._chatService.getUserConversations(userId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ conversations }, Messages.CHAT.CONVERSATIONS_RETRIEVED),
    );
  }

  async getCompanyConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const companyId = req.params.companyId || req.user?.companyId;
    if (!companyId) {
      throw new AppError(Messages.ERROR.COMPANY_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    
    const conversations = await this._chatService.getCompanyConversations(companyId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ conversations }, Messages.CHAT.CONVERSATIONS_RETRIEVED),
    );
  }

  async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { conversationId } = req.params;
    const userId = req.user?.userId || req.user?.companyId;
    
    const conversation = await this._chatService.getConversation(conversationId, userId);
    if (!conversation) {
      throw new AppError(Messages.CHAT.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(conversation, Messages.CHAT.CONVERSATION_RETRIEVED),
    );
  }

  async getConversationByApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { applicationId } = req.params;
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
    if (req.headers.cookie) {
      authHeaders['Cookie'] = req.headers.cookie as string;
      console.log('ChatController] Forwarding cookies to application service');
    }
    const applicationDetails = await this._chatService.getApplicationDetails(
      applicationId,
      authHeaders,
    );
    let conversation = await this._chatService.getConversationByUserAndCompany(
      applicationDetails.userId,
      applicationDetails.companyId,
    );

    if (conversation) {
      console.log('[ChatController] Found existing conversation between user and company:', conversation.id);
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(conversation, Messages.CHAT.CONVERSATION_RETRIEVED),
      );
      return;
    }
    console.log('ChatController] No existing conversation found, creating new one...');
    conversation = await this._chatService.createConversationFromApplication(
      applicationId,
      applicationDetails.userId,
      applicationDetails.companyId,
    );
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(conversation, Messages.CHAT.CONVERSATION_RETRIEVED),
    );
  }

  async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validationResult = getMessagesSchema.safeParse({
      conversationId: req.params.conversationId,
      limit: req.query.limit,
      skip: req.query.skip,
    });

    if (!validationResult.success) {
      const errorDetails = validationResult.error.issues.map(issue => issue.message).join(', ');
      throw new AppError(`${Messages.ERROR.VALIDATION_FAILED}: ${errorDetails}`, HttpStatusCode.BAD_REQUEST);
    }

    const { conversationId, limit, skip } = validationResult.data;
    const messages = await this._chatService.getMessages(conversationId, limit, skip);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ messages }, Messages.CHAT.MESSAGES_RETRIEVED),
    );
  }

  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { conversationId } = req.params;
    let userId = req.user?.userId || req.user?.companyId;
    if (!userId && req.body?.userId) {
      userId = req.body.userId;
      console.log('[ChatController] Using userId from request body:', userId);
    }
    if (!userId) {
      const headerUserId = req.headers['x-user-id'] as string;
      if (headerUserId) {
        userId = headerUserId;
        console.log('[ChatController] Using userId from headers:', userId);
      }
    }
    
    if (!userId) {
      throw new AppError(Messages.ERROR.USER_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    
    await this._chatService.markAsRead(conversationId, userId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.CHAT.MARKED_AS_READ),
    );
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { conversationId } = req.params;
    const userId = req.user?.userId || req.user?.companyId;
    
    if (!userId) {
      throw new AppError(Messages.ERROR.USER_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    
    const count = await this._chatService.getUnreadCount(conversationId, userId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ unreadCount: count }, Messages.CHAT.UNREAD_COUNT_RETRIEVED),
    );
  }

  async getTotalUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || req.user?.companyId || req.params.userId;
    
    if (!userId) {
      throw new AppError(Messages.ERROR.USER_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    
    const count = await this._chatService.getTotalUnreadCount(userId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ unreadCount: count }, Messages.CHAT.TOTAL_UNREAD_COUNT_RETRIEVED),
    );
  }

  async getConversationsWithUnread(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || req.user?.companyId || req.params.userId;
    
    if (!userId) {
      throw new AppError(Messages.ERROR.USER_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    
    const conversations = await this._chatService.getConversationsWithUnread(userId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ conversations }, Messages.CHAT.CONVERSATIONS_WITH_UNREAD_RETRIEVED),
    );
  }
}