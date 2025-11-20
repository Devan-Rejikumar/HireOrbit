import { IConversationDocument, IMessageDocument } from '../../models/ChatModel';

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
  conversations: ConversationResponse[];
}

export interface MessageListResponse {
  messages: MessageResponse[];
}

export class ChatResponseMapper {
  static toConversationResponse(conversation: IConversationDocument): ConversationResponse {
    return {
      id: conversation._id.toString(),
      applicationId: conversation.applicationId,
      userId: conversation.userId,
      companyId: conversation.companyId,
      participants: conversation.participants,
      lastMessage: conversation.lastMessage ? {
        content: conversation.lastMessage.content,
        senderId: conversation.lastMessage.senderId,
        timestamp: conversation.lastMessage.timestamp 
          ? (conversation.lastMessage.timestamp instanceof Date 
              ? conversation.lastMessage.timestamp.toISOString()
              : new Date(conversation.lastMessage.timestamp).toISOString())
          : new Date().toISOString()
      } : undefined,
      unreadCount: conversation.unreadCount instanceof Map 
        ? Object.fromEntries(conversation.unreadCount)
        : (conversation.unreadCount as Record<string, number>),
      createdAt: conversation.createdAt 
        ? (conversation.createdAt instanceof Date 
            ? conversation.createdAt.toISOString()
            : new Date(conversation.createdAt).toISOString())
        : new Date().toISOString(),
      updatedAt: conversation.updatedAt 
        ? (conversation.updatedAt instanceof Date 
            ? conversation.updatedAt.toISOString()
            : new Date(conversation.updatedAt).toISOString())
        : new Date().toISOString()
    };
  }

  static toMessageResponse(message: IMessageDocument): MessageResponse {
    return {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      readBy: message.readBy,
      createdAt: message.createdAt 
        ? (message.createdAt instanceof Date 
            ? message.createdAt.toISOString()
            : new Date(message.createdAt).toISOString())
        : new Date().toISOString(),
      updatedAt: message.updatedAt 
        ? (message.updatedAt instanceof Date 
            ? message.updatedAt.toISOString()
            : new Date(message.updatedAt).toISOString())
        : new Date().toISOString()
    };
  }

  static toConversationListResponse(conversations: IConversationDocument[]): ConversationListResponse {
    return {
      conversations: conversations.map(conv => this.toConversationResponse(conv))
    };
  }

  static toMessageListResponse(messages: IMessageDocument[]): MessageListResponse {
    return {
      messages: messages.map(msg => this.toMessageResponse(msg))
    };
  }
}

