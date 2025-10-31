import mongoose, { Schema, Document, Types } from 'mongoose';
import { NotificationType } from '../types/notifications';

export interface INotificationDocument extends Document {
  _id: Types.ObjectId;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: {
    applicationId: string;
    jobId?: string;
    status?: string;
    applicantName?: string;
    jobTitle?: string;
  };
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

const NotificationSchema = new Schema<INotificationDocument>({
  recipientId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: Object.values(NotificationType) },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    applicationId: { type: String, required: true },
    jobId: String,
    status: String,
    applicantName: String,
    jobTitle: String
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  readAt: Date
}, {
  timestamps: true
});

export const NotificationModel = mongoose.model<INotificationDocument>('Notification', NotificationSchema);