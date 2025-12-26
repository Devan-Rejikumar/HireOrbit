import { IConversationDocument, IMessageDocument } from '../../models/ChatModel';

export interface IChatRepository {
    createConversation(applicationId: string, userId: string, companyId: string): Promise<IConversationDocument>;
    findConversationByApplicationId(applicationId: string): Promise<IConversationDocument | null>;
    findConversationByUserAndCompany(userId: string, companyId: string): Promise<IConversationDocument | null>;
    findConversationById(conversationId: string): Promise<IConversationDocument | null>;
    getUserConversations(userId:string):Promise<IConversationDocument[]>;
    getCompanyConversations(companyId:string):Promise<IConversationDocument[]>;
    updateConversationLastMessage(conversationId:string,message:{content:string;senderId: string;timestamp:Date}):Promise<void>;
    incrementUnreadCount(conversationId:string,userId:string):Promise<void>;
    resetUnreadCount(conversationId:string,userId:string):Promise<void>;
    createMessage(conversationId:string,senderId:string,content:string,messageType?:'text' | 'image' | 'file'):Promise<IMessageDocument>;
    getConversationMessages(conversationId:string,limit?:number,skip?:number):Promise<IMessageDocument[]>;
    markMessageAsRead(conversationId:string,userId:string):Promise<void>;
    getUnreadMessageCount(conversationId:string,userId:string):Promise<number>;
    getTotalUnreadCount(userId:string):Promise<number>;
    getConversationsWithUnread(userId:string):Promise<IConversationDocument[]>;

}