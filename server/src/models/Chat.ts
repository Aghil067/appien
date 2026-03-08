import mongoose, { Document, Schema } from 'mongoose';

// --- Interfaces ---

interface ReplyContext {
  id: string;
  text: string;
  senderName: string;
  isMe: boolean;
}

interface Message {
  senderId: string;
  text: string;
  createdAt: Date;
  replyContext?: ReplyContext; // Optional field for reply info
}

export interface IChat extends Document {
  questionId: string; 
  askerId: string;    
  responderId: string;
  status: 'pending' | 'accepted' | 'rejected';
  messages: Message[];
  createdAt: Date;
}

// --- Schema ---

const ChatSchema: Schema = new Schema({
  questionId: { type: String, required: true },
  askerId: { type: String, required: true },
  responderId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  
  messages: [{
    senderId: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    
    // NEW: Stores the quoted message details
    replyContext: {
      id: String,
      text: String,
      senderName: String,
      isMe: Boolean
    }
  }]
}, { timestamps: true });

export default mongoose.model<IChat>('Chat', ChatSchema);