import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessageDocument extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationDocument extends Document {
  _id: Types.ObjectId;
  applicationId: string; 
  userId: string; 
  companyId: string; 
  participants: string[]; 
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: {
    [userId: string]: number; 
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>({
  conversationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true, 
    index: true 
  },
  senderId: { 
    type: String, 
    required: true, 
    index: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'file'], 
    default: 'text' 
  },
  readBy: [{ 
    type: String 
  }],
}, {
  timestamps: true
});

const ConversationSchema = new Schema<IConversationDocument>({
  applicationId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  companyId: { 
    type: String, 
    required: true 
  },
  participants: [{ 
    type: String, 
    required: true
  }],
  lastMessage: {
    content: String,
    senderId: String,
    timestamp: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
}, {
  timestamps: true
});

ConversationSchema.index({ participants: 1 });

export const MessageModel = mongoose.model<IMessageDocument>('Message', MessageSchema);
export const ConversationModel = mongoose.model<IConversationDocument>('Conversation', ConversationSchema);