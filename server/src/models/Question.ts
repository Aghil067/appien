import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
    _id: string;
    text: string;
    responderId: string;
    responderName: string;
    responderLocation?: string;
    responderIsTrusted?: boolean; // Trusted badge indicator
    parentId?: string;
    createdAt: Date;
    // --- NEW MODERATION FIELDS ---
    helpfulBy: string[];   // Array of User IDs
    disagreeBy: string[];  // Array of User IDs
    reportsBy: string[];   // Array of User IDs
    isHidden: boolean;     // True if reports > threshold
}

export interface IQuestion extends Document {
    text: string;
    askerId: string;
    location: { type: string; coordinates: number[] };
    userLocation?: string;
    expiresAt: Date;
    answers: IAnswer[];
    createdAt: Date;
}

const QuestionSchema: Schema = new Schema({
    text: { type: String, required: true },
    askerId: { type: String, required: true },
    location: { type: { type: String, default: 'Point' }, coordinates: [Number] },
    expiresAt: { type: Date, required: true },
    userLocation: { type: String, default: 'Unknown' }, // Snapshot of asker's location
    answers: [{
        text: String,
        responderId: String,
        responderName: { type: String, default: 'Anonymous' },
        responderLocation: { type: String, default: 'Unknown' }, // Snapshot of responder's location
        responderIsTrusted: { type: Boolean, default: false }, // Trusted badge
        parentId: { type: String, default: null },
        createdAt: { type: Date, default: Date.now },

        // --- NEW FIELDS ---
        helpfulBy: [String],
        disagreeBy: [String],
        reportsBy: [String],
        isHidden: { type: Boolean, default: false }
    }]
}, { timestamps: true });

QuestionSchema.index({ location: '2dsphere' });

export default mongoose.model<IQuestion>('Question', QuestionSchema);