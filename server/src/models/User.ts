import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  picture?: string;
  username?: string;
  isVerified: boolean;
  location: string;
  settings: {
    notifications: boolean;
    darkMode: boolean;
    isPrivate: boolean;
  };
  blockedUsers: string[];
  // --- TRUSTED BADGE SYSTEM ---
  isTrusted: boolean;
  reputation: {
    totalAnswers: number;
    helpfulCount: number;
    lastCalculated: Date;
  };
  // --- NEW FIELD: Push Subscription ---
  pushSubscription?: {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  };
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  picture: { type: String },
  username: { type: String },
  isVerified: { type: Boolean, default: false },
  location: { type: String, default: 'Unknown Location' },
  settings: {
    notifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: true }
  },
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // --- TRUSTED BADGE SYSTEM ---
  isTrusted: { type: Boolean, default: false },
  reputation: {
    totalAnswers: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
    lastCalculated: { type: Date, default: Date.now }
  },
  // --- NEW FIELD ---
  pushSubscription: {
    endpoint: { type: String },
    keys: {
      auth: { type: String },
      p256dh: { type: String }
    }
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);