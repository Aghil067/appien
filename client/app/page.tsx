"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image'; // Replaces html2canvas
import {
    Send, Zap, Sparkles, Clock, MessageCircle, ChevronDown, Lock, Shield,
    Reply, MessageSquare, Flag, AlertTriangle, UserX,
    History, CheckCircle2, AlertCircle, ArrowRight, Loader2, ArrowDown, Trash2, MapPin, Share2
} from 'lucide-react';
import { AnimatedSmile, AnimatedSad } from '@/components/AnimatedIcons';
import { formatDistanceToNow } from 'date-fns';
import getSocket from '@/lib/socket';
import { toast } from 'react-toastify';
import ConfirmModal from '@/components/ConfirmModal';

import API_BASE from '@/lib/api';

// --- Types ---
interface Answer {
    _id: string;
    text: string;
    responderId: string;
    responderName: string;
    responderLocation?: string;
    responderIsTrusted?: boolean;
    parentId?: string;
    createdAt: string;
    helpfulBy: string[];
    disagreeBy: string[];
    reportsBy: string[];
    isHidden: boolean;
}

interface Question {
    _id: string;
    text: string;
    askerId: string;
    userLocation?: string;
    answers: Answer[];
    createdAt: string;
    expiresAt: string;
}

// --- SHARE HIDDEN CARD ---
const ShareHiddenCard = ({ data, cardRef }: { data: { q: Question; a: Answer } | null, cardRef: any }) => {
    if (!data) return null;
    return (
        <div
            ref={cardRef}
            style={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                zIndex: -1000,
                width: '400px',
                visibility: 'hidden',
                pointerEvents: 'none',
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                fontFamily: 'sans-serif',
                border: '1px solid #ffb732',
                boxSizing: 'border-box',
                color: '#000000'
            }}
        >
            <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Question</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.625', margin: 0 }}>{data.q.text}</p>
            </div>
            <div style={{ marginBottom: '24px', paddingLeft: '12px', borderLeft: '2px solid #fed7aa' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Answer</span>
                <p style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.625', margin: 0 }}>{data.a.text}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', marginTop: '8px' }}>
                <img src="/appien-marker.png" alt="Logo" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Info from Appien</span>
            </div>
        </div>
    );
};

interface QuestionCardProps {
    q: Question;
    currentUserId: string | null;
    isReadOnly: boolean;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    replyText: string;
    setReplyText: (text: string) => void;
    replyingToId: string | null;
    setReplyingToId: (id: string | null) => void;
    handleReply: (id: string) => void;
    handleDelete: (id: string) => void;
    openConfirm: (title: string, message: string, onConfirm: () => void, isDestructive?: boolean) => void;
    onShare: (q: Question, a: Answer) => void;
}

// --- EXTRACTED COMPONENT ---
const QuestionCard = ({
    q, currentUserId, isReadOnly, expandedId, setExpandedId, replyText, setReplyText, replyingToId, setReplyingToId, handleReply, handleDelete, openConfirm, onShare
}: QuestionCardProps) => {

    const isAsker = currentUserId === q.askerId;
    const [showHiddenId, setShowHiddenId] = useState<string | null>(null);

    const handleAction = async (answerId: string, action: 'helpful' | 'disagree' | 'report') => {
        if (!currentUserId) return toast.error("Please login");

        // ------------------------------------------
        // CONFETTI REMOVED FOR PROFESSIONAL LOOK
        // ------------------------------------------

        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_BASE}/questions/${q._id}/answers/${answerId}/action`,
                { action }, { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) { toast.error("Action failed"); }
    };

    const [profileMenuId, setProfileMenuId] = useState<string | null>(null);

    return (
        <div id={`question-${q._id}`} className={`group bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[18px] sm:rounded-[20px] md:rounded-[24px] border transition-all duration-300 mb-4 sm:mb-5 ${isReadOnly ? 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 opacity-80' : 'border-white/60 dark:border-slate-800/60 shadow-sm hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] hover:border-orange-200/50 dark:hover:border-orange-900/50'}`}>

            {/* Header */}
            <div onClick={() => { setExpandedId(expandedId === q._id ? null : q._id); setProfileMenuId(null); }} className="p-4 sm:p-5 md:p-6 cursor-pointer relative overflow-hidden touch-manipulation">
                {/* Subtle Hover Highlight */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-50/0 via-orange-50/40 to-orange-50/0 dark:via-orange-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="flex justify-between items-start mb-3 relative z-10 gap-2">
                    <h3 className={`text-base sm:text-lg font-semibold leading-relaxed flex-1 ${isReadOnly ? 'text-gray-500 dark:text-gray-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {q.text}
                    </h3>
                    <div className="flex gap-1 items-center flex-shrink-0">
                        {isReadOnly && <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-1 rounded-full font-semibold uppercase flex items-center gap-1 border border-slate-200 dark:border-slate-700"><Lock size={10} /> Closed</span>}
                        {!isReadOnly && isAsker && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(q._id); }}
                                className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                                title="Delete Question"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                            <Clock size={13} /> <span>{formatDistanceToNow(new Date(q.createdAt))} ago</span>
                            <span className="mx-1">•</span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {q.userLocation || "Nearby"}
                            </span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${q.answers.length > 0 ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                            <MessageCircle size={12} /> {q.answers.length}
                        </div>
                    </div>
                    <button className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${expandedId === q._id ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rotate-180' : 'text-[#ffb732] dark:text-[#ffb732] hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}>
                        <ChevronDown size={18} />
                    </button>
                </div>
            </div>

            {/* Answers Body */}
            <div className={`grid transition-all duration-500 ease-in-out ${expandedId === q._id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="bg-slate-100/60 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 p-3 md:p-5 rounded-b-[20px]">
                        <div className="space-y-4 md:space-y-5 mb-4 md:mb-5">
                            {q.answers.map((ans, idx) => {
                                const isHidden = ans.isHidden;
                                const isLowQuality = ans.disagreeBy.length >= 3;
                                const isMyAnswer = ans.responderId === currentUserId;

                                if (isHidden && showHiddenId !== ans._id && !isMyAnswer) {
                                    return (
                                        <div key={idx} className="flex gap-3 items-center justify-center p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-400 dark:text-gray-500 border-dashed">
                                            <AlertTriangle size={14} className="text-amber-400" /> Low quality answer hidden.
                                            <button onClick={() => setShowHiddenId(ans._id)} className="font-semibold hover:text-orange-600 dark:hover:text-orange-400 underline decoration-orange-200 dark:decoration-orange-900">Show</button>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={idx} className={`flex gap-2 md:gap-3 ${ans.parentId ? 'ml-2 pl-2 md:ml-6 md:pl-4 border-l-2 border-orange-100 dark:border-orange-900/30' : ''} ${isLowQuality ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>

                                        {/* PROFILE AVATAR with Mini-Menu */}
                                        <div className="relative">
                                            <div
                                                onClick={() => !isMyAnswer && setProfileMenuId(profileMenuId === ans._id ? null : ans._id)}
                                                className={`
                                                    w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] md:text-xs font-semibold text-orange-600 dark:text-orange-400 shadow-sm
                                                    ${!isMyAnswer ? 'cursor-pointer hover:border-orange-300 dark:hover:border-orange-700' : 'cursor-default'}
                                                `}
                                            >
                                                {ans.responderName ? ans.responderName[0] : 'A'}
                                            </div>

                                            {/* Profile Menu */}
                                            {profileMenuId === ans._id && !isMyAnswer && (
                                                <div className="absolute top-9 left-0 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 w-40 animate-in zoom-in-95 duration-200">
                                                    <div className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">{ans.responderName}</div>

                                                    {/* Send Thank You - Only for Question Asker */}
                                                    {isAsker && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const customMessage = prompt("Add a personal message (optional):");
                                                                if (customMessage === null) return; // User cancelled

                                                                try {
                                                                    const token = localStorage.getItem('token');
                                                                    await axios.post(`${API_BASE}/thank-you`, {
                                                                        questionId: q._id,
                                                                        answerId: ans._id,
                                                                        message: customMessage || undefined
                                                                    }, { headers: { Authorization: `Bearer ${token}` } });

                                                                    setProfileMenuId(null);
                                                                    toast.success("Thank you note sent!");
                                                                } catch (error) {
                                                                    toast.error("Failed to send thank you note");
                                                                }
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg flex items-center gap-2 font-medium"
                                                        >
                                                            <MessageSquare size={12} /> Send Thank You
                                                        </button>
                                                    )}

                                                    {/* Block User */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openConfirm(
                                                                "Block User",
                                                                "Are you sure you want to block this user? Their content will be hidden.",
                                                                async () => {
                                                                    const token = localStorage.getItem('token');
                                                                    await axios.post(`${API_BASE}/users/block`, { targetId: ans.responderId }, { headers: { Authorization: `Bearer ${token}` } });
                                                                    setProfileMenuId(null);
                                                                    window.location.reload();
                                                                },
                                                                true
                                                            );
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 font-medium"
                                                    >
                                                        <UserX size={12} /> Block User
                                                    </button>
                                                </div>
                                            )}

                                            {/* Click outside closer overlay */}
                                            {profileMenuId === ans._id && (
                                                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuId(null)}></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="bg-white dark:bg-slate-900 p-3 md:p-3.5 rounded-2xl rounded-tl-none shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 hover:border-orange-100 dark:hover:border-orange-900 transition-colors">
                                                {/* Responder Name with Trusted Badge */}
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{ans.responderName}</span>
                                                    {ans.responderIsTrusted && (
                                                        <div className="group/badge relative inline-flex items-center">
                                                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md shadow-sm">
                                                                <Shield size={10} className="text-white" strokeWidth={2.5} />
                                                                <span className="text-[9px] font-bold text-white uppercase tracking-wide">Trusted</span>
                                                            </div>
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-[10px] rounded-lg opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                                                Verified helpful contributor
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300 text-sm mb-2.5 leading-relaxed break-words">{ans.text}</p>

                                                <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800">
                                                    <div className="flex gap-4 items-center">

                                                        {/* --- 😊 ANIMATED SMILEY (Helpful) --- */}
                                                        <button
                                                            onClick={() => handleAction(ans._id, 'helpful')}
                                                            className="group/btn flex items-center gap-1.5 focus:outline-none"
                                                            title="Helpful"
                                                        >
                                                            <AnimatedSmile isActive={ans.helpfulBy.includes(currentUserId || '')} />
                                                            <span className={`text-[10px] font-bold ${ans.helpfulBy.includes(currentUserId || '') ? 'text-amber-500' : 'text-slate-400'} group-hover/btn:text-amber-500 transition-colors`}>
                                                                {ans.helpfulBy.length || ''}
                                                            </span>
                                                        </button>

                                                        {/* --- ☹️ ANIMATED SAD (Disagree) --- */}
                                                        <button
                                                            onClick={() => handleAction(ans._id, 'disagree')}
                                                            className="group/btn flex items-center gap-1.5 focus:outline-none"
                                                            title="Disagree"
                                                        >
                                                            <AnimatedSad isActive={ans.disagreeBy.includes(currentUserId || '')} />
                                                        </button>

                                                        {/* --- 🚩 REPORT --- */}
                                                        <button
                                                            onClick={() => {
                                                                openConfirm(
                                                                    "Report Content",
                                                                    "Are you sure you want to report this content?",
                                                                    () => handleAction(ans._id, 'report'),
                                                                    true
                                                                );
                                                            }}
                                                            className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 transition-colors"
                                                            title="Report Content"
                                                        >
                                                            <Flag size={12} />
                                                        </button>

                                                        {/* --- 📤 SHARE --- */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onShare(q, ans);
                                                            }}
                                                            className="text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                                            title="Share as Image"
                                                        >
                                                            <Share2 size={12} />
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {!isReadOnly && isAsker && !ans.parentId && (
                                                            <button onClick={() => { setReplyText(`@${ans.responderName} `); setReplyingToId(ans._id); }} className="text-[#ffb732] dark:text-[#ffb732] text-[10px] font-bold hover:underline flex items-center gap-1">
                                                                <Reply size={10} /> Reply
                                                            </button>
                                                        )}

                                                        {!isReadOnly && isAsker && ans.responderId !== currentUserId && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openConfirm(
                                                                        "Start Chat",
                                                                        "Send a request to start a private chat?",
                                                                        async () => {
                                                                            const token = localStorage.getItem('token');
                                                                            try {
                                                                                await axios.post(`${API_BASE}/chat/request`,
                                                                                    { questionId: q._id, responderId: ans.responderId },
                                                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                                                );
                                                                                toast.success("Request sent!");
                                                                            } catch (err: unknown) {
                                                                                if (axios.isAxiosError(err)) {
                                                                                    toast.error(err.response?.data?.error || "Request failed or already sent.");
                                                                                } else {
                                                                                    toast.error("An unexpected error occurred.");
                                                                                }
                                                                            }
                                                                        }
                                                                    );
                                                                }}
                                                                className="text-[#ffb732] dark:text-[#ffb732] text-[10px] font-bold hover:bg-[#ffb732]/10 dark:hover:bg-[#ffb732]/20 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                                                            >
                                                                <MessageSquare size={10} /> Chat
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 ml-2 font-medium flex items-center gap-1">
                                                {ans.responderName} • <span className="opacity-80">{formatDistanceToNow(new Date(ans.createdAt))} ago</span> • <span>{ans.responderLocation || "Nearby"}</span>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {q.answers.length === 0 && (
                                <div className="text-center py-6">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">No answers yet. Be the first!</p>
                                </div>
                            )}
                        </div>

                        {!isReadOnly && (
                            <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-orange-100 dark:focus-within:ring-orange-900 focus-within:border-orange-300 dark:focus-within:border-orange-700 transition-all">
                                <input type="text" className="flex-1 pl-4 pr-2 py-2 bg-transparent rounded-full text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500" placeholder="Type a helpful answer..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReply(q._id)} />
                                <button onClick={() => handleReply(q._id)} disabled={!replyText} className="bg-[#ffb732] dark:bg-[#ffb732] text-black p-2 rounded-full hover:bg-[#e6a42d] dark:hover:bg-[#e6a42d] hover:shadow-md disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"><Send size={16} className={replyText ? "translate-x-0.5" : ""} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

// --- MAIN PAGE ---
export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [questionText, setQuestionText] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [archivedQuestions, setArchivedQuestions] = useState<Question[]>([]);
    const [view, setView] = useState<'active' | 'closed'>('active');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Question[]>([]);
    const [similarSuggestions, setSimilarSuggestions] = useState<Question[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

    // Pagination State
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { }, isDestructive: false });

    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    const openConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
        setConfirmState({ isOpen: true, title, message, onConfirm, isDestructive });
    };

    const checkAndPromptNotifications = () => {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") {
            setShowNotificationPrompt(true);
        }
    };

    const router = useRouter();

    // --- SHARE LOGIC ---
    const [shareData, setShareData] = useState<{ q: Question; a: Answer } | null>(null);
    const shareRef = useRef<HTMLDivElement>(null);

    const handleShareCapture = async (q: Question, a: Answer) => {
        try {
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas size
            canvas.width = 800; // 400px * 2 for retina
            canvas.height = 600;

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Border
            ctx.strokeStyle = '#ffb732';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);

            let y = 60;

            // Question label
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('QUESTION', 48, y);
            y += 40;

            // Question text
            ctx.fillStyle = '#0f172a';
            ctx.font = '600 28px sans-serif';
            const qLines = wrapText(ctx, q.text, 700);
            qLines.forEach(line => {
                ctx.fillText(line, 48, y);
                y += 36;
            });
            y += 20;

            // Answer label
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('ANSWER', 72, y);
            y += 40;

            // Left border for answer
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(48, y - 30, 4, 100);

            // Answer text
            ctx.fillStyle = '#1e293b';
            ctx.font = '28px sans-serif';
            const aLines = wrapText(ctx, a.text, 680);
            aLines.forEach(line => {
                ctx.fillText(line, 72, y);
                y += 36;
            });
            y += 40;

            // Top border for footer
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(48, y);
            ctx.lineTo(752, y);
            ctx.stroke();
            y += 40;

            // Load and draw logo
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = '/appien-marker.png';

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    ctx.drawImage(img, 48, y - 30, 60, 60);

                    // "Info from Appien" text
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = 'bold 20px sans-serif';
                    ctx.fillText('INFO FROM APPIEN', 120, y);

                    resolve(true);
                };
                img.onerror = () => {
                    // Draw without logo if it fails
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = 'bold 20px sans-serif';
                    ctx.fillText('INFO FROM APPIEN', 48, y);
                    resolve(true);
                };
            });

            // Convert to blob
            canvas.toBlob(async (blob) => {
                if (blob) {
                    // Try COPY TO CLIPBOARD first
                    // Try COPY TO CLIPBOARD first
                    try {
                        const textData = new Blob(['Check this out on Appien! https://appien.com'], { type: 'text/plain' });
                        await navigator.clipboard.write([
                            new ClipboardItem({ 
                                'image/png': blob,
                                'text/plain': textData
                            })
                        ]);
                        toast.success("Image & Link Copied!");
                    } catch (clipboardErr) {
                        console.warn("Clipboard write failed, trying Share Sheet...", clipboardErr);

                        // Fallback to Share Sheet
                        const file = new File([blob], 'appien-share.png', { type: 'image/png' });
                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                            try {
                                await navigator.share({
                                    files: [file],
                                    title: 'Share from Appien',
                                    text: 'Check this out on Appien! https://appien.com',
                                    url: 'https://appien.com'
                                });
                            } catch (shareErr) {
                                // User cancelled
                            }
                        } else {
                            toast.error("Could not copy. Browser restricted.");
                        }
                    }
                }
            }, 'image/png');

        } catch (e: any) {
            console.error("Canvas error:", e);
            toast.error("Share failed: " + (e.message || "Unknown error"));
        }
    };

    // Helper function to wrap text
    function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    const fetchData = async (token: string, isLoadMore = false) => {
        try {
            if (!isLoadMore) setIsLoading(true); else setIsLoadingMore(true);

            // Use API_BASE here
            const userRes = await axios.get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
            setCurrentUserId(userRes.data._id);
            setBlockedUsers(userRes.data.blockedUsers || []);

            const skip = isLoadMore ? questions.length : 0;
            // Use API_BASE here
            const qRes = await axios.get(`${API_BASE}/questions/nearby?skip=${skip}`, { headers: { Authorization: `Bearer ${token}` } });

            if (qRes.data.length < 20) setHasMore(false);

            if (isLoadMore) {
                setQuestions(prev => [...prev, ...qRes.data]);
            } else {
                setQuestions(qRes.data);
                // Use API_BASE here
                const aRes = await axios.get(`${API_BASE}/questions/archive`, { headers: { Authorization: `Bearer ${token}` } });
                setArchivedQuestions(aRes.data);
            }
        } catch (e) {
            if (axios.isAxiosError(e) && e.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('darkMode');
                router.push('/login');
                return;
            }
            console.error(e);
        } finally { setIsLoading(false); setIsLoadingMore(false); }
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#question-')) {
                const id = hash.replace('#question-', '');
                setExpandedId(id);
                setTimeout(() => {
                    const el = document.getElementById(`question-${id}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-[#ffb732]', 'ring-offset-2', 'dark:ring-offset-slate-950');
                        setTimeout(() => {
                            el.classList.remove('ring-2', 'ring-[#ffb732]', 'ring-offset-2', 'dark:ring-offset-slate-950');
                        }, 3000);
                    }
                }, 500);
            }
        };

        if (!isLoading && questions.length > 0) {
            handleHashChange();
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [isLoading, questions]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); } else { fetchData(token); }
    }, [router]);

    const handleDeleteQuestion = async (id: string) => {
        openConfirm(
            "Delete Question",
            "Are you sure you want to delete this question? This action cannot be undone.",
            async () => {
                const token = localStorage.getItem('token');
                try {
                    await axios.delete(`${API_BASE}/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                    // Optimistic update
                    setQuestions(prev => prev.filter(q => q._id !== id));
                    toast.success("Question deleted");
                } catch (e) { toast.error("Delete failed"); }
            },
            true
        );
    };

    useEffect(() => {
        if (isLoading) return;
        // Use API_BASE for Socket too
        const socket = getSocket();

        socket.on('new_question_nearby', (newQ: Question) => {
            // Basic check: don't add if asker is blocked
            if (!blockedUsers.includes(newQ.askerId)) {
                setQuestions(prev => [newQ, ...prev]);
            }
        });

        socket.on('question_updated', (updatedQ: Question) => {
            // FILTER BLOCKED CONTENT CLIENT-SIDE
            const filteredQ = { ...updatedQ };
            if (blockedUsers.length > 0) {
                filteredQ.answers = updatedQ.answers.filter(a => !blockedUsers.includes(a.responderId));
            }
            setQuestions(prev => prev.map(q => q._id === updatedQ._id ? filteredQ : q));
        });

        socket.on('question_deleted', (id: string) => setQuestions(prev => prev.filter(q => q._id !== id)));

        return () => {
            socket.off('new_question_nearby');
            socket.off('question_updated');
            socket.off('question_deleted');
        };
    }, [isLoading, blockedUsers]); // Depend on blockedUsers to refresh closure

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (questionText.length > 5) {
                const token = localStorage.getItem('token');
                try {
                    // Use API_BASE here
                    const res = await axios.post(`${API_BASE}/questions/check-similar`, { text: questionText }, { headers: { Authorization: `Bearer ${token}` } });
                    setSuggestions(res.data);
                } catch (e) { console.error(e); }
            } else { setSuggestions([]); }
        }, 500);
        return () => clearTimeout(handler);
    }, [questionText]);

    const handleLoadMore = () => {
        const token = localStorage.getItem('token');
        if (token) fetchData(token, true);
    };

    const handleAsk = async () => {
        if (!questionText) return;

        // Client-side validation
        if (questionText.trim().length < 5) {
            toast.error("Question must be at least 5 characters");
            return;
        }

        if (questionText.length > 500) {
            toast.error("Question is too long (max 500 characters)");
            return;
        }

        const token = localStorage.getItem('token');
        try {
            // Use API_BASE here
            await axios.post(`${API_BASE}/questions`, { text: questionText }, { headers: { Authorization: `Bearer ${token}` } });
            setQuestionText('');
            setSuggestions([]);

            toast.success("Question posted!");
            checkAndPromptNotifications();

        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                const errorDetails = error.response?.data?.details;
                if (errorDetails && errorDetails.length > 0) {
                    toast.error(errorDetails[0].message || "Invalid question format");
                } else {
                    toast.error(error.response?.data?.error || "Failed to post question");
                }
            } else {
                toast.error("Failed to post question. Please try again.");
            }
        }
    };


    const handleReply = async (questionId: string) => {
        if (!replyText) return;
        const token = localStorage.getItem('token');
        const currentQ = questions.find(q => q._id === questionId);

        try {
            // Use API_BASE here
            await axios.post(`${API_BASE}/questions/${questionId}/answer`, { text: replyText, parentId: replyingToId }, { headers: { Authorization: `Bearer ${token}` } });
            setReplyText(''); setReplyingToId(null);

            // --- FETCH SIMILAR TO ENGAGE USER ---
            if (currentQ) {
                try {
                    const simRes = await axios.post(`${API_BASE}/questions/similar-nearby`, {
                        text: currentQ.text,
                        excludeId: questionId,
                        location: currentQ.userLocation
                    }, { headers: { Authorization: `Bearer ${token}` } });

                    if (simRes.data.length > 0) {
                        setSimilarSuggestions(simRes.data);
                    }
                } catch (e) { console.error("Sim fetch fail", e); }
            }
            
            checkAndPromptNotifications();

        } catch (err) { toast.error("Failed to reply"); }
    };

    if (isLoading && questions.length === 0) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-orange-600 dark:text-orange-400" /></div>;

    return (
        <>
            <ShareHiddenCard data={shareData} cardRef={shareRef} />
            <main className="grid grid-cols-12 gap-4 sm:gap-6 items-start min-h-screen max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-24 md:pb-28 pt-[88px] sm:pt-[96px] bg-transparent transition-colors duration-300">

                <ConfirmModal
                    isOpen={confirmState.isOpen}
                    onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmState.onConfirm}
                    title={confirmState.title}
                    message={confirmState.message}
                    isDestructive={confirmState.isDestructive}
                />

                {showNotificationPrompt && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative">
                            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                                <AlertCircle size={20} className="text-[#ffb732]" />
                                Enable Notifications
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Get push notifications when someone replies or answers. <br /><br />
                                <b>Chrome users:</b> If disabled, click the <Lock size={12} className="inline mx-1" /> icon in your address bar and set Notifications to <b>Allow</b>.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowNotificationPrompt(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Later</button>
                                <button onClick={() => {
                                    setShowNotificationPrompt(false);
                                    if ("Notification" in window) {
                                        Notification.requestPermission().then(permission => {
                                            if (permission === 'denied') {
                                                toast.warn("Could not enable notification. Please check browser blocking.");
                                            } else if (permission === 'granted') {
                                                toast.success("Notifications allowed!");
                                            }
                                        });
                                    }
                                }} className="px-4 py-2 text-sm font-bold bg-[#ffb732] text-black rounded-lg hover:bg-[#e6a42d] transition-colors shadow-sm">Allow Notifications</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Background Gradient Mesh */}
                <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50/70 to-transparent dark:from-orange-950/25 pointer-events-none z-0"></div>

                {/* Left Column: Quick Prompts */}
                <div className="hidden lg:block col-span-3 sticky top-24 animate-in slide-in-from-left-4 duration-700 z-10">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[24px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-white dark:border-slate-800">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="p-2 bg-amber-100/80 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400"><Zap size={18} /></div>
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quick Ask</h3>
                        </div>
                        <div className="space-y-2">
                            {[
                                "Which food places are better for talking than eating?",
                                "Where can we hang out late without alcohol?",
                                "Any places that stay chill after 8pm?",
                                "Where can we take kids right now where they won’t get bored?",
                                "Any calm places for late evening hangouts?"
                            ].map((txt, i) => (
                                <button key={i} onClick={() => setQuestionText(txt)} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-[#ffb732] rounded-xl transition-all duration-200 border border-transparent hover:border-orange-100 dark:hover:border-orange-800/50 group shadow-sm hover:shadow-md">
                                    <span className="group-hover:translate-x-1 inline-block transition-transform">{txt}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Column: Feed */}
                <div className="col-span-12 lg:col-span-6 space-y-4 sm:space-y-5 md:space-y-6 z-10">

                    {/* 1. Ask Box */}
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-[20px] sm:rounded-[24px] shadow-[0_8px_30px_rgba(249,115,22,0.10)] dark:shadow-none border border-white dark:border-slate-800 relative z-20 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(249,115,22,0.14)] focus-within:shadow-[0_8px_40px_rgba(249,115,22,0.14)] focus-within:border-[#ffb732] dark:focus-within:border-[#ffb732]/60 focus-within:ring-2 focus-within:ring-[#ffb732]/30 dark:focus-within:ring-[#ffb732]/20 group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-[#ffb732] to-orange-400 rounded-t-[20px] sm:rounded-t-[24px] opacity-90 group-hover:opacity-100 transition-opacity"></div>
                        <textarea
                            className="w-full text-base sm:text-lg outline-none resize-none text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 bg-transparent min-h-[90px] sm:min-h-[100px] font-medium leading-relaxed touch-manipulation"
                            placeholder="What are you deciding right now?"
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                        />
                        <div className="flex justify-end items-center pt-3 sm:pt-4 mt-2 border-t border-slate-50 dark:border-slate-800">
                            <button onClick={handleAsk} disabled={!questionText} className="bg-[#ffb732] hover:bg-[#e6a42d] text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-sm shadow-lg shadow-orange-200/50 dark:shadow-orange-900/50 hover:shadow-orange-300/60 dark:hover:shadow-orange-900/60 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all flex items-center gap-2 active:scale-95 touch-manipulation min-h-[44px]">
                                Ask <Send size={16} />
                            </button>
                        </div>

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="mt-4 bg-orange-50/80 dark:bg-orange-950/40 backdrop-blur-sm border border-orange-100 dark:border-orange-900/50 rounded-2xl p-4 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2 uppercase tracking-wide">
                                        <AlertCircle size={14} /> Similar questions
                                    </span>
                                    <button onClick={() => setSuggestions([])} className="text-[10px] font-medium text-orange-400 dark:text-orange-500 hover:text-orange-600 dark:hover:text-orange-300 underline">Dismiss</button>
                                </div>
                                <div className="space-y-2">
                                    {suggestions.map((s, i) => (
                                        <div key={i} onClick={() => { setExpandedId(s._id); setQuestionText(''); setSuggestions([]); }} className="text-sm p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-orange-100 dark:border-orange-900/50 cursor-pointer hover:shadow-md dark:hover:shadow-none hover:border-orange-200 dark:hover:border-orange-800 transition-all flex justify-between items-center group">
                                            <span className="truncate font-medium text-slate-700 dark:text-slate-300 group-hover:text-orange-700 dark:group-hover:text-orange-400">{s.text}</span>
                                            <ArrowRight size={14} className="text-orange-300 dark:text-orange-500/50 group-hover:text-orange-500 dark:group-hover:text-orange-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Quick Ask - Only visible on mobile/tablet */}
                    <div className="lg:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-[18px] sm:rounded-[20px] shadow-sm border border-white dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-amber-100/80 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                <Zap size={14} />
                            </div>
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quick Ask</h3>
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                            {["Which food places are better for talking than eating?", "Any places that stay chill after 8pm?", "Any calm places for late evening hangouts?"].map((txt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setQuestionText(txt)}
                                    className="flex-shrink-0 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-[#ffb732] rounded-lg transition-all duration-200 border border-transparent hover:border-orange-100 dark:hover:border-orange-800/50 whitespace-nowrap active:scale-95"
                                >
                                    {txt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Tabs */}
                    <div className="flex p-1.5 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl">
                        <button onClick={() => setView('active')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'active' ? 'bg-white dark:bg-slate-900 text-[#ffb732] dark:text-[#ffb732] shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            <CheckCircle2 size={16} /> Active
                        </button>
                        <button onClick={() => setView('closed')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'closed' ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            <History size={16} /> Closed
                        </button>
                    </div>

                    <div
                        ref={scrollRef}
                        className="space-y-4 pb-32 h-[calc(100dvh-180px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2"
                    >
                        {view === 'active' ? (
                            <>
                                {questions.length === 0 ? (
                                    <div className="text-center py-24 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[24px] bg-slate-50/50 dark:bg-slate-900/30">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-200 dark:text-orange-900/50 shadow-sm">
                                            <MessageCircle size={32} />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">It&apos;s quiet here...</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Be the first to start a conversation nearby!</p>
                                    </div>
                                ) : (
                                    questions.map(q => <QuestionCard key={q._id} q={q} currentUserId={currentUserId} isReadOnly={false} expandedId={expandedId} setExpandedId={setExpandedId} replyText={replyText} setReplyText={setReplyText} replyingToId={replyingToId} setReplyingToId={setReplyingToId} handleReply={handleReply} handleDelete={handleDeleteQuestion} openConfirm={openConfirm} onShare={handleShareCapture} />)
                                )}

                                {/* Load More Inside the Scroll Box */}
                                {questions.length > 0 && hasMore && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                        className="w-full py-4 mt-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                    >
                                        {isLoadingMore ? <Loader2 className="animate-spin" size={14} /> : <ArrowDown size={14} />}
                                        {isLoadingMore ? "Loading more..." : "Load More Questions"}
                                    </button>
                                )}

                                {!hasMore && questions.length > 0 && (
                                    <div className="text-center py-8 text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest border-t border-dashed border-slate-200 dark:border-slate-800 mt-8">
                                        You are all caught up
                                    </div>
                                )}
                            </>
                        ) : (
                            archivedQuestions.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm italic">No closed questions found.</div>
                            ) : (
                                archivedQuestions.map(q => <QuestionCard key={q._id} q={q} currentUserId={currentUserId} isReadOnly={true} expandedId={expandedId} setExpandedId={setExpandedId} replyText={replyText} setReplyText={setReplyText} replyingToId={replyingToId} setReplyingToId={setReplyingToId} handleReply={handleReply} handleDelete={handleDeleteQuestion} openConfirm={openConfirm} onShare={handleShareCapture} />)
                            )
                        )}
                    </div>
                </div>

                {/* Right Column: Live Stats OR Suggestion Box */}
                <div className="hidden lg:block col-span-3 sticky top-24 animate-in slide-in-from-right-4 duration-700 z-10 transition-all">
                    {similarSuggestions.length > 0 ? (
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[24px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] border border-orange-200 dark:border-orange-900/50 animate-in slide-in-from-right-8 fade-in duration-500">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="p-2 bg-[#ffb732] rounded-xl text-black shadow-lg shadow-orange-200/50 dark:shadow-orange-900/20"><Sparkles size={18} /></div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Help Someone Nearby</h3>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {similarSuggestions.map((s, i) => (
                                    <div key={i} onClick={() => { setExpandedId(s._id); setSimilarSuggestions([]); }} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-800 rounded-xl cursor-pointer group transition-all hover:shadow-md">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">{s.text}</p>
                                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                            <MapPin size={10} /> {s.userLocation || "Nearby"} • <span className="text-orange-500">{s.answers.length} answers</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setSimilarSuggestions([])} className="w-full mt-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Dismiss</button>
                        </div>
                    ) : (
                        <div className="bg-[#ffb732] rounded-[24px] p-8 shadow-xl shadow-orange-200/50 dark:shadow-orange-900/20 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400 opacity-20 rounded-full blur-2xl -ml-8 -mb-8"></div>

                            <h3 className="font-bold text-lg relative z-10 flex items-center gap-2 text-slate-900"><Zap size={18} className="text-slate-900 fill-slate-900" /> Live Nearby</h3>
                            <div className="mt-4 flex items-baseline gap-1.5 relative z-10">
                                <span className="text-5xl font-extrabold tracking-tighter text-slate-900">{questions.length}</span>
                                <span className="text-slate-800 text-sm font-medium">active<br />conversations</span>
                            </div>
                            <p className="text-slate-800 text-xs mt-6 leading-relaxed relative z-10 font-medium">
                                Your neighborhood is buzzing! Join in to earn reputation points.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
