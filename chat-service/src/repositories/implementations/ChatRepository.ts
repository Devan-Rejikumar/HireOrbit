import { injectable } from 'inversify';
import { ConversationModel, MessageModel, IConversationDocument, IMessageDocument } from '../../models/ChatModel';
import { IChatRepository } from '../interfaces/IChatRepository';

@injectable()
export class ChatRepository implements IChatRepository {

  async createConversation(applicationId: string,userId: string,companyId: string): Promise<IConversationDocument> {
    const conversation = new ConversationModel({
      applicationId,
      userId,
      companyId,
      participants: [userId, companyId],
      unreadCount: {},
    });
    return await conversation.save();
  }
  
  async findConversationByApplicationId(applicationId: string): Promise<IConversationDocument | null> {
    return await ConversationModel.findOne({ applicationId });
  }
  
  async findConversationByUserAndCompany(userId: string, companyId: string): Promise<IConversationDocument | null> {
    return await ConversationModel.findOne({
      participants: { $all: [userId, companyId] },
    });
  }
  
  async findConversationById(conversationId: string): Promise<IConversationDocument | null> {
    return await ConversationModel.findById(conversationId);
  }
  
  async getUserConversations(userId: string): Promise<IConversationDocument[]> {
    return await ConversationModel.find({ participants: userId })
      .sort({ updatedAt: -1 });
  }
  
  async getCompanyConversations(companyId: string): Promise<IConversationDocument[]> {
    return await ConversationModel.find({ participants: companyId })
      .sort({ updatedAt: -1 });
  }
  
  async updateConversationLastMessage(conversationId: string,message: { content: string; senderId: string; timestamp: Date } ): Promise<void> {
    await ConversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: message,
      updatedAt: new Date(),
    });
  }
  
  async incrementUnreadCount(conversationId: string,userId: string): Promise<void> {
    const conversation = await ConversationModel.findById(conversationId);
    if (conversation) {
      const unreadCountObj = conversation.unreadCount as Record<string, number>;
      const currentCount = unreadCountObj[userId] || 0;
      unreadCountObj[userId] = currentCount + 1;
      await conversation.save();
    }
  }
  
  async resetUnreadCount(conversationId: string,userId: string): Promise<void> {
    const conversation = await ConversationModel.findById(conversationId);
    if (conversation) {
      const unreadCountObj = conversation.unreadCount as Record<string, number>;
      unreadCountObj[userId] = 0;
      await conversation.save();
    }
  }

  async createMessage(conversationId: string,senderId: string,content: string,messageType: 'text' | 'image' | 'file' = 'text'): Promise<IMessageDocument> {
    const message = new MessageModel({
      conversationId,
      senderId,
      content,
      messageType,
      readBy: [],
    });
    return await message.save();
  }
  
  async getConversationMessages(conversationId: string,limit: number = 50,skip: number = 0): Promise<IMessageDocument[]> {
    return await MessageModel.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }
  
  async markMessageAsRead(conversationId: string,userId: string): Promise<void> {
    await MessageModel.updateMany(
      { 
        conversationId,
        senderId: { $ne: userId }, 
        readBy: { $ne: userId },    
      },
      { $addToSet: { readBy: userId } },
    );
  }
  
  async getUnreadMessageCount(conversationId: string,userId: string): Promise<number> {
    return await MessageModel.countDocuments({
      conversationId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    });
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const conversations = await ConversationModel.find({
      participants: userId,
    });
    
    if (conversations.length === 0) return 0;

    const conversationIds = conversations.map(conv => conv._id);
    const totalUnread = await MessageModel.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    });
    
    return totalUnread;
  }

  async getConversationsWithUnread(userId: string): Promise<IConversationDocument[]> {
    const conversations = await ConversationModel.find({
      participants: userId,
    });
    
    if (conversations.length === 0) return [];
    const conversationsWithUnread: IConversationDocument[] = [];
    
    for (const conversation of conversations) {
      const unreadCount = await MessageModel.countDocuments({
        conversationId: conversation._id,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      });
      
      if (unreadCount > 0) {
        const unreadCountObj = conversation.unreadCount as Record<string, number> || {};
        unreadCountObj[userId] = unreadCount;
        conversation.unreadCount = unreadCountObj as { [userId: string]: number };
        conversationsWithUnread.push(conversation);
      }
    }
    conversationsWithUnread.sort((a, b) => {
      const aUnread = (a.unreadCount as Record<string, number>)?.[userId] || 0;
      const bUnread = (b.unreadCount as Record<string, number>)?.[userId] || 0;
      if (aUnread !== bUnread) return bUnread - aUnread;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    return conversationsWithUnread;
  }
}