import dns from 'dns';
// Force IPv4 and specific DNS servers to resolve MongoDB Atlas
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder('ipv4first');
    }
} catch (error) {
    console.error('Failed to configure DNS:', error);
}

import dotenv from 'dotenv';
import axios from 'axios';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import webpush from 'web-push';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import Question from './models/Question';
import User from './models/User';
import Chat from './models/Chat';
import Notification from './models/Notification';
import { determineExpiryWithAI } from './services/ai';
import { updateTrustedBadgeOnAction } from './services/trustedBadge';
import {
    sendOtpSchema, verifyOtpSchema, updateSettingsSchema, postQuestionSchema,
    checkSimilarSchema, postAnswerSchema, actionSchema, chatRequestSchema,
    blockUserSchema, deleteUserSchema, geocodeSchema, similarNearbySchema, thankYouSchema
} from './validation';

dotenv.config();

// --- SECURE SECRETS ---
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@appien.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET; // For protecting admin endpoints
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

if (!MONGO_URI || !JWT_SECRET) {
    console.error("❌ CRITICAL: Missing MONGO_URI or JWT_SECRET in environment variables.");
    process.exit(1);
}

const app = express();
const server = http.createServer(app);
// Restart trigger
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
});

// Real-time Socket Handlers
io.on('connection', (socket) => {
    socket.on('join_user', (userId) => {
        socket.join(String(userId));
        console.log(`👤 User joined room: ${userId}`);
    });

    socket.on('disconnect', () => {
        // console.log('Client disconnected');
    });
});

app.use(helmet()); // Secure HTTP Headers
app.use(cors()); // Allow CORS (Configure strictly in production)
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(mongoSanitize()); // Prevent NoSQL Injection

// --- RATE LIMITERS ---
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased for dev/testing - 500 reqs per 15 mins
    message: "Too many requests, please try again later."
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 1000, // Relaxed for dev/testing
    message: "Too many login attempts, please try again in an hour."
});

// app.use(generalLimiter); // Disabled for dev/testing

if (PUBLIC_VAPID_KEY && PRIVATE_VAPID_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error(err));

// --- VALIDATION MIDDLEWARE ---
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = schema.parse(req.body); // Strip unknown keys too if configured, but here strict/safe
        next();
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation Error", details: err.issues });
        }
        next(err);
    }
};

// --- SMS HELPER (Fast2SMS) ---
const sendSmsOtp = async (phoneNumber: string, otp: string): Promise<void> => {
    if (!FAST2SMS_API_KEY) {
        console.warn('⚠️  FAST2SMS_API_KEY not set. OTP will only be logged.');
        console.log(`📲 OTP FOR ${phoneNumber}: ${otp}`);
        return;
    }
    try {
        // TODO (PRODUCTION): Switch to 'dlt' route once DLT registration is approved.
        // Use: route: 'dlt', sender_id: process.env.FAST2SMS_SENDER_ID, template_id: process.env.FAST2SMS_TEMPLATE_ID
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: FAST2SMS_API_KEY,
                route: 'q',           // Quick SMS (DEV ONLY — random sender name, switch to DLT for production)
                message: `Your Appien OTP is ${otp}. Valid for 5 minutes. Do not share it with anyone.`,
                language: 'english',
                flash: 0,
                numbers: phoneNumber,
            },
            headers: { 'cache-control': 'no-cache' }
        });
        console.log(`📲 SMS sent to ${phoneNumber}:`, response.data);
    } catch (error: any) {
        console.error('❌ Fast2SMS error:', error?.response?.data || error.message);
        // Don't throw — OTP is still saved in DB, manual lookup possible in dev
    }
};

// --- HELPERS ---
const getUserId = (req: Request) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        return decoded.id;
    } catch (e) {
        return null;
    }
};

// Security: Admin authentication middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = req.headers['x-admin-secret'];

    if (!ADMIN_SECRET) {
        return res.status(503).json({
            error: "Admin endpoints are disabled. Set ADMIN_SECRET in environment variables."
        });
    }

    if (!adminKey || adminKey !== ADMIN_SECRET) {
        return res.status(403).json({
            error: "Forbidden: Invalid or missing admin credentials"
        });
    }

    next();
};

const sendPush = async (userId: string, payload: { title: string, body: string }) => {
    try {
        const user = await User.findById(userId);
        if (user && user.pushSubscription && user.pushSubscription.endpoint && user.settings?.notifications) {
            await webpush.sendNotification(user.pushSubscription as any, JSON.stringify(payload));
        }
    } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Push sub expired/invalid for user ${userId}, removing...`);
            await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: "" } });
        } else {
            console.error("Push Failed", error);
        }
    }
};

const getSimilarity = (str1: string, str2: string) => {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
};

// --- 🔧 CORE FIX: THREADED SORTING LOGIC ---
// This ensures replies NEVER jump above their parents, regardless of likes.
const sortAnswersThreaded = (question: any) => {
    if (!question.answers || question.answers.length === 0) return;

    // 1. Separate Parents (Top-level) and Children (Replies)
    // We treat anything without a parentId as a Parent
    const parents = question.answers.filter((a: any) => !a.parentId);
    const children = question.answers.filter((a: any) => a.parentId);

    // 2. Sort PARENTS by Score (Highest Like-Dislike first)
    // Good answers go to top
    parents.sort((a: any, b: any) => {
        const scoreA = (a.helpfulBy?.length || 0) - (a.disagreeBy?.length || 0);
        const scoreB = (b.helpfulBy?.length || 0) - (b.disagreeBy?.length || 0);
        return scoreB - scoreA;
    });

    // 3. Sort CHILDREN by Date (Oldest -> Newest)
    // Replies should read like a conversation, not by likes
    children.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // 4. Reconstruct the list: Parent -> its Children -> Next Parent
    const sortedList: any[] = [];

    parents.forEach((parent: any) => {
        sortedList.push(parent);

        // Find all replies belonging to THIS parent
        const myReplies = children.filter((c: any) => c.parentId === parent._id.toString());
        sortedList.push(...myReplies);
    });

    // 5. Apply back to question
    question.answers = sortedList;
};

// --- ROUTES ---

app.post('/api/auth/send-otp', authLimiter, validate(sendOtpSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) { res.status(400).json({ error: "Phone required" }); return; }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        let user = await User.findOne({ phoneNumber });
        let isNewUser = true;
        let existingUsername = "";
        if (user) {
            if (user.username) { isNewUser = false; existingUsername = user.username; }
        } else { user = new User({ phoneNumber }); }
        user.otp = otp; user.otpExpires = new Date(Date.now() + 5 * 60000);
        await user.save();
        await sendSmsOtp(phoneNumber, otp);
        res.json({ message: "OTP sent", isNewUser, username: existingUsername });
    } catch (e) { res.status(500).json({ error: "Error sending OTP" }); }
});

app.post('/api/auth/verify-otp', authLimiter, validate(verifyOtpSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const { phoneNumber, otp, username, location } = req.body;
        const user = await User.findOne({ phoneNumber });
        // Security: Validate OTP and check expiry
        if (!user || user.otp !== otp) { res.status(400).json({ error: "Invalid OTP" }); return; }
        if (!user.otpExpires || user.otpExpires < new Date()) {
            res.status(400).json({ error: "OTP has expired. Please request a new one." });
            return;
        }
        if (username) user.username = username;
        if (location) user.location = location;
        user.otp = undefined; user.otpExpires = undefined; user.isVerified = true;
        await user.save();
        const token = jwt.sign(
            { id: user._id, phone: user.phoneNumber },
            JWT_SECRET,
            { expiresIn: '30d' } // Token expires in 30 days
        );
        res.json({ token, userId: user._id });
    } catch (e) { res.status(500).json({ error: "Error verifying OTP" }); }
});

app.get('/api/users/me', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const user = await User.findById(userId);
    res.json({ _id: user?._id, username: user?.username, phoneNumber: user?.phoneNumber, location: user?.location, blockedUsers: user?.blockedUsers, settings: user?.settings });
});

app.get('/api/users/activity', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
        const asked = await Question.find({ askerId: userId }).sort({ createdAt: -1 });
        const answeredRaw = await Question.find({ "answers.responderId": userId }).sort({ createdAt: -1 });
        const answered = answeredRaw.map(q => {
            const myAnswer = q.answers.find((a: any) => a.responderId === userId);
            return { _id: q._id, questionText: q.text, answerText: myAnswer?.text, createdAt: myAnswer?.createdAt };
        });
        res.json({ asked, answered });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.get('/api/users/settings', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const user = await User.findById(userId);
    res.json({ username: user?.username, location: user?.location, settings: user?.settings, blockedCount: user?.blockedUsers?.length || 0 });
});

app.put('/api/users/settings', validate(updateSettingsSchema), async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const user = await User.findById(userId);
    if (!user) return;

    // Handle username update with uniqueness check
    if (req.body.username !== undefined && req.body.username !== user.username) {
        const newUsername = req.body.username.trim();

        // Validate username
        if (!newUsername || newUsername.length < 3) {
            res.status(400).json({ error: "Username must be at least 3 characters" });
            return;
        }

        if (newUsername.length > 20) {
            res.status(400).json({ error: "Username must be less than 20 characters" });
            return;
        }

        // Check if username already exists
        const existing = await User.findOne({ username: newUsername });
        if (existing && existing._id.toString() !== userId) {
            res.status(400).json({ error: "Username already taken" });
            return;
        }

        user.username = newUsername;
    }

    if (req.body.location) user.location = req.body.location;
    if (req.body.notifications !== undefined) user.settings.notifications = req.body.notifications;
    if (req.body.darkMode !== undefined) user.settings.darkMode = req.body.darkMode;
    if (req.body.isPrivate !== undefined) user.settings.isPrivate = req.body.isPrivate;
    await user.save();
    res.json({ message: "Updated" });
});

app.post('/api/users/delete-otp', authLimiter, async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60000);
    await user.save();

    await sendSmsOtp(user.phoneNumber, otp);
    res.json({ message: "OTP sent" });
});

app.delete('/api/users/me', authLimiter, validate(deleteUserSchema), async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { otp } = req.body;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Security: Validate OTP and check expiry
    if (!otp || user.otp !== otp) {
        res.status(400).json({ error: "Invalid OTP" });
        return;
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
        res.status(400).json({ error: "OTP has expired. Please request a new one." });
        return;
    }

    // Clean up ALL data
    await Question.deleteMany({ askerId: userId });
    await Chat.deleteMany({ $or: [{ askerId: userId }, { responderId: userId }] });
    await Notification.deleteMany({ $or: [{ recipientId: userId }, { senderId: userId }] });
    await User.findByIdAndDelete(userId);

    res.json({ message: "Deleted" });
});

app.post('/api/users/block', validate(blockUserSchema), async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { targetId } = req.body;
    if (!userId || !targetId) { res.status(400).json({ error: "Missing data" }); return; }
    await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: targetId } });
    res.json({ message: "Blocked" });
});

app.post('/api/users/unblock', validate(blockUserSchema), async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { targetId } = req.body;
    await User.findByIdAndUpdate(userId, { $pull: { blockedUsers: targetId } });
    res.json({ message: "Unblocked" });
});

app.get('/api/users/blocked', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const user = await User.findById(userId).populate('blockedUsers', 'username _id settings');

    // Filter out nulls (in case a blocked user was deleted) and map
    const blockedList = (user?.blockedUsers || [])
        .filter((u: any) => u)
        .map((u: any) => {
            if (u.settings?.isPrivate) {
                return { _id: u._id, username: 'Anonymous' };
            }
            return { _id: u._id, username: u.username };
        });

    res.json(blockedList);
});

app.post('/api/notifications/subscribe', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await User.findByIdAndUpdate(userId, { pushSubscription: req.body });
    res.json({ message: "Subscribed" });
});

app.post('/api/notifications/unsubscribe', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: "" } });
    res.json({ message: "Unsubscribed" });
});



app.get('/api/notifications', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const notifications = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
});

app.post('/api/notifications/read', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
    res.json({ success: true });
});

// DELETE ALL NOTIFICATIONS (for testing/cleanup)
app.delete('/api/notifications/all', requireAdmin, async (req: Request, res: Response) => {
    try {
        await Notification.deleteMany({});
        res.json({ message: "All notifications deleted", success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete notifications" });
    }
});

// DEBUG: Get ALL notifications (for testing)
app.get('/api/notifications/debug', requireAdmin, async (req: Request, res: Response) => {
    try {
        const all = await Notification.find({}).sort({ createdAt: -1 }).limit(50);
        res.json({ count: all.length, notifications: all });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch" });
    }
});

// WIPE ALL DATA (for testing/reset)
app.delete('/api/admin/wipe-all', requireAdmin, async (req: Request, res: Response) => {
    try {
        await User.deleteMany({});
        await Question.deleteMany({});
        await Chat.deleteMany({});
        await Notification.deleteMany({});
        res.json({
            message: "💥 All data wiped! Database is now empty.",
            success: true
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to wipe data" });
    }
});

// SEED TEST DATA
app.post('/api/admin/seed', requireAdmin, async (req: Request, res: Response) => {
    try {
        const users = [
            { username: "hsr_user", phoneNumber: "9999900001", location: "HSR", settings: { isPrivate: false, notifications: true } },
            { username: "krmgla_user1", phoneNumber: "9999900002", location: "Koramangala", settings: { isPrivate: false, notifications: true } },
            { username: "krmgla_user2", phoneNumber: "9999900003", location: "Koramangala", settings: { isPrivate: false, notifications: true } },
            { username: "both_user", phoneNumber: "9999900004", location: "Both", settings: { isPrivate: false, notifications: true } }
        ];

        for (const u of users) {
            const newUser = new User({ ...u, isVerified: true });
            await newUser.save();
        }
        res.json({ success: true, message: "Created 4 test users" });
    } catch (e) {
        res.status(500).json({ error: "Failed to seed" });
    }
});

app.post('/api/questions/check-similar', validate(checkSimilarSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const { text } = req.body;
        if (!text || text.length < 5) { res.json([]); return; }
        const activeQuestions = await Question.find({ expiresAt: { $gt: new Date() } });
        const matches = activeQuestions.filter(q => {
            const score = getSimilarity(text, q.text);
            return score > 0.3;
        }).slice(0, 3);
        res.json(matches);
    } catch (error) { res.status(500).json({ error: 'Check failed' }); }
});

app.post('/api/questions/similar-nearby', validate(similarNearbySchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, excludeId, location } = req.body;
        if (!text) { res.json([]); return; }

        const filter: any = {
            expiresAt: { $gt: new Date() },
            _id: { $ne: excludeId }
        };

        if (location) {
            // Simple string matching for now since we store location as string in userLocation
            // For production, this should be geospatial
            filter.userLocation = location;
        }

        const activeQuestions = await Question.find(filter).limit(50);

        const matches = activeQuestions.filter(q => {
            const score = getSimilarity(text, q.text);
            return score > 0.2; // Slightly lower threshold for "nearby similar" to get more results
        }).sort((a, b) => getSimilarity(text, b.text) - getSimilarity(text, a.text)).slice(0, 3);

        res.json(matches);
    } catch (error) { res.status(500).json({ error: 'Search failed' }); }
});

app.post('/api/questions', validate(postQuestionSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getUserId(req);
        const { text } = req.body;
        if (!text) { res.status(400).json({ error: "Text required" }); return; }
        const user = await User.findById(userId);
        const userLocation = user?.location || 'Unknown';
        const expiresAt = await determineExpiryWithAI(text);
        const newQuestion = new Question({ text, askerId: userId || 'anon_id', userLocation, expiresAt, location: { type: 'Point', coordinates: [0, 0] } });
        await newQuestion.save();

        // Emit to everyone for feed (all questions visible to all)
        io.emit('new_question_nearby', newQuestion);

        // Send notifications ONLY to users in matching location or 'Both'
        // If question is from HSR -> notify HSR and Both users
        // If question is from Koramangala -> notify Koramangala and Both users
        const usersToNotify = await User.find({
            $or: [
                { location: userLocation },
                { location: 'Both' }
            ],
            _id: { $ne: userId } // Don't notify the asker
        });

        // Create in-app notifications and send push notifications
        const senderUsername = user?.username || 'Someone';
        const isPrivate = user?.settings?.isPrivate || false;
        const displayName = isPrivate ? 'Someone' : senderUsername;

        for (const targetUser of usersToNotify) {
            // Create in-app notification (stored in database)
            const notif = new Notification({
                recipientId: targetUser._id,
                senderId: userId,
                type: 'NEW_QUESTION',
                questionId: newQuestion._id,
                text: `${displayName} asked: "${text.length > 60 ? text.substring(0, 60) + '...' : text}"`
            });
            await notif.save();

            // Emit real-time notification via socket
            const targetRoom = String(targetUser._id);
            io.to(targetRoom).emit('notification', notif.toObject());

            // Send push notification if enabled
            if (targetUser.settings?.notifications) {
                sendPush(targetUser._id.toString(), {
                    title: `New Question in ${userLocation}`,
                    body: `${displayName}: ${text.substring(0, 50)}`
                });
            }
        }

        res.status(201).json(newQuestion);
    } catch (error) { res.status(500).json({ error: 'Server Error' }); }
});

// --- UPDATED NEARBY ROUTE (With Threaded Sorting & Block Filtering) ---
app.get('/api/questions/nearby', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = 20;

    let filter: any = { expiresAt: { $gt: new Date() } };
    let blockedIds: string[] = [];

    if (userId) {
        const me = await User.findById(userId);
        if (me?.blockedUsers?.length) {
            blockedIds = me.blockedUsers.map(id => id.toString());
            filter.askerId = { $nin: blockedIds };
        }
    }

    const questions = await Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    // APPLY THREADED SORT & FILTER BLOCKED ANSWERS
    questions.forEach(q => {
        if (blockedIds.length > 0) {
            q.answers = q.answers.filter((a: any) => !blockedIds.includes(a.responderId)) as any;
        }
        sortAnswersThreaded(q);
    });

    res.json(questions);
});

// --- UPDATED ARCHIVE ROUTE (With Threaded Sorting & Block Filtering) ---
app.get('/api/questions/archive', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    let blockedIds: string[] = [];

    if (userId) {
        const me = await User.findById(userId);
        if (me?.blockedUsers?.length) blockedIds = me.blockedUsers.map(id => id.toString());
    }

    // If user has blocked people, filter their questions out of archive too
    const filter: any = { expiresAt: { $lt: new Date() } };
    if (blockedIds.length > 0) filter.askerId = { $nin: blockedIds };

    const questions = await Question.find(filter).sort({ createdAt: -1 }).limit(10);

    // APPLY THREADED SORT & FILTER BLOCKED ANSWERS
    questions.forEach(q => {
        if (blockedIds.length > 0) {
            q.answers = q.answers.filter((a: any) => !blockedIds.includes(a.responderId)) as any;
        }
        sortAnswersThreaded(q);
    });

    res.json(questions);
});

app.post('/api/questions/:id/answer', validate(postAnswerSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, parentId } = req.body;
        const userId = getUserId(req);
        const question = await Question.findById(req.params.id);
        if (!question) { res.status(404).json({ error: "Question not found" }); return; }
        if (new Date() > new Date(question.expiresAt)) { res.status(400).json({ error: "Expired" }); return; }

        const user = await User.findById(userId);
        const isPrivate = user?.settings?.isPrivate || false;
        const responderName = isPrivate ? "Anonymous" : (user?.username || "Anonymous");
        const responderLocation = user?.location || "Unknown";
        const responderIsTrusted = user?.isTrusted || false;

        const newAnswer = { text, responderId: userId || 'anon', responderName, responderLocation, responderIsTrusted, parentId: parentId || null, createdAt: new Date() };
        question.answers.push(newAnswer as any);
        await question.save();

        if (question.askerId !== userId) {
            const notifText = `${responderName} answered: "${text.length > 60 ? text.substring(0, 60) + '...' : text}"`;
            const notif = new Notification({ recipientId: question.askerId, senderId: userId, type: 'REPLY', questionId: question._id, text: notifText });
            await notif.save();
            if (question.askerId) {
                const targetRoom = String(question.askerId);
                console.log(`🔔 Emitting REPLY notification to room: ${targetRoom}`);
                io.to(targetRoom).emit('notification', notif.toObject());
            }
            sendPush(question.askerId, { title: "New Answer", body: `${responderName}: ${text.substring(0, 50)}` });
        }

        // APPLY THREADED SORT BEFORE EMIT
        sortAnswersThreaded(question);

        io.emit('question_updated', question);
        res.json(question);
    } catch (error) { res.status(500).json({ error: 'Server Error' }); }
});

app.post('/api/questions/:qId/answers/:aId/action', validate(actionSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getUserId(req);
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
        const { action } = req.body;
        const question = await Question.findById(req.params.qId);
        if (!question) { res.status(404).json({ error: "Not Found" }); return; }
        const answer = question.answers.find((ans: any) => ans._id.toString() === req.params.aId);
        if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }

        const toggle = (arr: string[]) => { const i = arr.indexOf(userId); if (i === -1) arr.push(userId); else arr.splice(i, 1); };
        const remove = (arr: string[]) => { const i = arr.indexOf(userId); if (i !== -1) arr.splice(i, 1); };

        if (action === 'helpful') {
            // Remove from disagree if present (mutual exclusivity)
            remove(answer.disagreeBy);
            // Toggle helpful
            toggle(answer.helpfulBy);
            if (answer.helpfulBy.includes(userId) && answer.responderId !== userId) {
                const liker = await User.findById(userId);
                const likerName = liker?.settings?.isPrivate ? 'Someone' : (liker?.username || 'Someone');
                const notifText = `${likerName} found your answer helpful!`;
                const notif = new Notification({ recipientId: answer.responderId, senderId: userId, type: 'HELPFUL', questionId: question._id, text: notifText });
                await notif.save();
                const targetRoom = String(answer.responderId);
                console.log(`🔔 Emitting HELPFUL notification to room: ${targetRoom}`);
                io.to(targetRoom).emit('notification', notif.toObject());
                sendPush(answer.responderId, { title: "Helpful!", body: `${likerName} found your answer helpful` });
            }
        }
        else if (action === 'disagree') {
            // Remove from helpful if present (mutual exclusivity)
            remove(answer.helpfulBy);
            // Toggle disagree
            toggle(answer.disagreeBy);
        }
        else if (action === 'report') {
            if (!answer.reportsBy.includes(userId)) answer.reportsBy.push(userId);
            if (answer.reportsBy.length >= 5) {
                question.answers = question.answers.filter((ans: any) => ans._id.toString() !== req.params.aId) as any;
            }
        }

        // --- UPDATE TRUSTED BADGE ON HELPFUL VOTE ---
        if (action === 'helpful' && !answer.helpfulBy.includes(userId)) {
            // Trigger badge recalculation for the answer author (async, non-blocking)
            updateTrustedBadgeOnAction(answer.responderId.toString()).catch(err =>
                console.error('Badge update failed:', err)
            );
        }

        // APPLY THREADED SORT
        sortAnswersThreaded(question);

        await question.save();
        io.emit('question_updated', question);
        res.json(question);
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

app.post('/api/chat/request', validate(chatRequestSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const askerId = getUserId(req);
        const { questionId, responderId } = req.body;
        if (!askerId) { res.status(401).json({ error: "Unauthorized" }); return; }

        // --- PRIVACY CHECK ---
        const responder = await User.findById(responderId);
        if (!responder) { res.status(404).json({ error: "User not found" }); return; }

        if (responder.settings?.isPrivate) {
            // We allow the chat, but the responder will appear anonymous to the asker (handled in list/fetch)
            // No error here anymore.
        }
        // ---------------------

        // Check if any chat already exists between these two users (bidirectional)
        const existing = await Chat.findOne({
            $or: [
                { askerId, responderId },
                { askerId: responderId, responderId: askerId }
            ]
        });
        if (existing) { res.status(400).json({ error: "Chat already exists with this user" }); return; }

        const newChat = new Chat({ questionId, askerId, responderId, status: 'pending', messages: [] });
        await newChat.save();

        const asker = await User.findById(askerId);
        const askerName = asker?.settings?.isPrivate ? 'Someone' : (asker?.username || 'Someone');
        const notifText = `${askerName} wants to chat with you`;

        const notif = new Notification({ recipientId: responderId, senderId: askerId, type: 'CHAT_REQUEST', questionId: questionId, text: notifText });
        await notif.save();

        const targetRoom = String(responderId);
        console.log(`🔔 Emitting CHAT REQUEST notification to room: ${targetRoom}`);
        io.to(targetRoom).emit('notification', notif.toObject());
        sendPush(responderId, { title: "Chat Request", body: `${askerName} wants to chat` });
        io.emit(`chat_request_${responderId}`, newChat);

        res.json({ message: "Sent", chat: newChat });
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

app.get('/api/chat/list', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    // START BLOCKING LOGIC
    const me = await User.findById(userId);
    const blockedIds = me?.blockedUsers?.map(id => id.toString()) || [];

    // Find chats where I am a participant
    let chats: any = await Chat.find({ $or: [{ askerId: userId }, { responderId: userId }] }).sort({ updatedAt: -1 }).lean();

    if (blockedIds.length > 0) {
        chats = chats.filter((c: any) => {
            const otherId = c.askerId === userId ? c.responderId : c.askerId;
            return !blockedIds.includes(otherId);
        });
    }
    // END BLOCKING LOGIC

    // --- POPULATE NAMES (PRIVACY AWARE) ---
    const populatedChats = await Promise.all(chats.map(async (chat: any) => {
        const otherId = chat.askerId === userId ? chat.responderId : chat.askerId;
        const otherUser = await User.findById(otherId);

        // PRIVACY CHECK
        let displayName = "Anonymous";
        if (otherUser && !otherUser.settings?.isPrivate) {
            displayName = otherUser.username || "Unknown";
        }

        return { ...chat, otherUserName: displayName };
    }));

    res.json(populatedChats);
});

app.post('/api/chat/:id/accept', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const chat = await Chat.findById(req.params.id);
    if (!chat || chat.responderId !== userId) { res.status(403).json({ error: "Not authorized" }); return; }
    chat.status = 'accepted';
    chat.messages.push({ senderId: 'system', text: "Chat started! You are both anonymous.", createdAt: new Date() });
    await chat.save();
    io.emit(`chat_update_${chat._id}`, chat);
    io.emit('chat_updated_global', chat);
    sendPush(chat.askerId, { title: "Chat Accepted", body: "Start chatting!" });
    res.json(chat);
});

app.delete('/api/chat/:id', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
    }

    try {
        const chat = await Chat.findOneAndDelete({
            _id: req.params.id,
            $or: [{ askerId: userId }, { responderId: userId }]
        });

        if (!chat) {
            res.status(404).json({ error: "Chat not found or unauthorized" });
            return;
        }

        io.emit(`chat_update_${chat._id}`, { ...chat.toObject(), status: 'deleted' });
        res.json({ message: "Deleted" });
    } catch (e) {
        console.error("Delete Error:", e);
        res.status(500).json({ error: "Delete failed" });
    }
});

app.delete('/api/questions/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getUserId(req);
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const question = await Question.findById(req.params.id);
        if (!question) { res.status(404).json({ error: "Question not found" }); return; }

        if (question.askerId !== userId) {
            res.status(403).json({ error: "Only the author can delete this." });
            return;
        }

        await Question.findByIdAndDelete(req.params.id);
        io.emit('question_deleted', req.params.id);
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

app.post('/api/utils/geocode', validate(geocodeSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getUserId(req);
        if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const { lat, lon } = req.body;
        if (!lat || !lon) { res.status(400).json({ error: "Missing coordinates" }); return; }

        // Fetch from OSM Nominatim
        // IMPT: User-Agent is required by OSM policy.
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: {
                'User-Agent': 'Appien-Local-Dev/1.0 (admin@appien.com)'
            }
        });

        if (!response.ok) {
            console.error("OSM Error:", response.status, response.statusText);
            res.status(502).json({ error: "Geocoding service error" });
            return;
        }

        const data: any = await response.json();
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || "Unknown Location";

        res.json({ city });
    } catch (e) {
        console.error("Geocode Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

app.post('/api/chat/:id/message', async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { text, replyContext } = req.body;
    const chat = await Chat.findById(req.params.id);
    if (!chat) { res.status(404).json({ error: "Chat not found" }); return; }
    const msg = { senderId: userId || 'anon', text, createdAt: new Date(), replyContext: replyContext || null };
    chat.messages.push(msg);
    await chat.save();
    io.emit(`chat_update_${chat._id}`, chat);
    io.emit('chat_updated_global', chat);
    const recipientId = chat.askerId === userId ? chat.responderId : chat.askerId;
    sendPush(recipientId, { title: "New Message", body: "New secure message received." });
    res.json(chat);
});

// --- THANK YOU NOTE ENDPOINT ---
app.post('/api/thank-you', validate(thankYouSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const senderId = getUserId(req);
        if (!senderId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const { questionId, answerId, message } = req.body;

        // Verify the question exists and sender is the asker
        const question = await Question.findById(questionId);
        if (!question) { res.status(404).json({ error: "Question not found" }); return; }
        if (question.askerId !== senderId) {
            res.status(403).json({ error: "Only the question asker can send thank you notes" });
            return;
        }

        // Find the answer and get responder info
        const answer = question.answers.find((ans: any) => ans._id.toString() === answerId);
        if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }

        const recipientId = answer.responderId;
        if (recipientId === senderId) {
            res.status(400).json({ error: "Cannot thank yourself" });
            return;
        }

        // Get sender info
        const sender = await User.findById(senderId);
        const senderName = sender?.username || "Someone";

        // Create custom message or use default
        const thankYouText = message
            ? `${senderName} thanked you: "${message}"`
            : `${senderName} thanked you for your helpful answer!`;

        // Create notification
        const notification = new Notification({
            recipientId,
            senderId,
            type: 'THANK_YOU',
            questionId,
            answerId,
            text: thankYouText
        });
        await notification.save();

        // Emit real-time notification
        io.to(String(recipientId)).emit('notification', notification.toObject());

        // Send push notification
        sendPush(recipientId, {
            title: "Thank You! 🙏",
            body: thankYouText
        });

        res.json({ success: true, message: "Thank you note sent!" });
    } catch (error) {
        console.error('Thank you error:', error);
        res.status(500).json({ error: "Server Error" });
    }
});

const PORT = Number(process.env.PORT) || 5000;
const serverInstance = server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} (0.0.0.0)`));

const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    serverInstance.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);