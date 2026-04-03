import { z } from 'zod';

export const googleAuthSchema = z.object({
    credential: z.string().min(1, "Google credential required"),
    username: z.string().min(3).max(20).optional(),
    location: z.string().optional(),
});

export const updateSettingsSchema = z.object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric only").optional(),
    location: z.string().optional(),
    notifications: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    isPrivate: z.boolean().optional(),
});

export const postQuestionSchema = z.object({
    text: z.string().min(5, "Question must be at least 5 characters").max(500, "Question too long"),
});

export const checkSimilarSchema = z.object({
    text: z.string().min(5),
});

export const similarNearbySchema = z.object({
    text: z.string().optional(),
    excludeId: z.string().optional(),
    location: z.string().optional(),
});

export const postAnswerSchema = z.object({
    text: z.string().min(1, "Answer cannot be empty").max(1000, "Answer too long"),
    parentId: z.string().optional().nullable(),
});

export const actionSchema = z.object({
    action: z.enum(['helpful', 'disagree', 'report']),
});

export const chatRequestSchema = z.object({
    questionId: z.string(),
    responderId: z.string(),
});

export const blockUserSchema = z.object({
    targetId: z.string(),
});

export const deleteUserSchema = z.object({});

export const geocodeSchema = z.object({
    lat: z.number(),
    lon: z.number(),
});

export const thankYouSchema = z.object({
    questionId: z.string(),
    answerId: z.string(),
    message: z.string().min(1, "Message cannot be empty").max(200, "Message too long").optional(),
});
