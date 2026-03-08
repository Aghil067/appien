import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: string; // Who gets the notification
  senderId: string;    // Who triggered it
  type: 'REPLY' | 'HELPFUL' | 'CHAT_REQUEST' | 'NEW_QUESTION' | 'THANK_YOU';
  questionId?: string; // Link to context
  answerId?: string;   // Link to specific answer (for THANK_YOU)
  text: string;        // Notification message
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  recipientId: { type: String, required: true },
  senderId: { type: String, required: true },
  type: { type: String, required: true },
  questionId: { type: String },
  answerId: { type: String },
  text: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);