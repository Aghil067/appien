"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
    MessageSquare, Check, X, Send, Lock, User, ChevronLeft,
    MoreVertical, Reply, Smile, Paperclip, Trash2, ArrowLeft,
    Clock, RefreshCw, UserX
} from 'lucide-react';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import ConfirmModal from '@/components/ConfirmModal';

import API_BASE from '@/lib/api';

interface ReplyContext {
    text: string;
    senderName: string;
    id: string;
    isMe: boolean;
}

interface Message {
    _id?: string;
    senderId: string;
    text: string;
    createdAt: string;
    replyContext?: ReplyContext;
}

interface Chat {
    _id: string;
    status: string;
    askerId: string;
    responderId: string;
    messages: Message[];
    updatedAt?: string;
    otherUserName?: string;
}

export default function InboxPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentUserId, setCurrentUserId] = useState('');
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [msgText, setMsgText] = useState('');
    const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, chatId: string } | null>(null);

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { }, isDestructive: false });

    const openConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
        setConfirmState({ isOpen: true, title, message, onConfirm, isDestructive });
    };

    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // --- HELPER FUNCTIONS ---
    const scrollToBottom = () => {
        // Instant scroll for better feel
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const fetchChats = (token: string) => {
        setIsRefreshing(true);
        axios.get(`${API_BASE}/chat/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setChats(res.data))
            .catch(err => {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('darkMode');
                    router.push('/login');
                }
            })
            .finally(() => setTimeout(() => setIsRefreshing(false), 500));
    };

    // --- EFFECTS ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        axios.get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setCurrentUserId(res.data._id))
            .catch(err => {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('darkMode');
                    router.push('/login');
                }
            });

        fetchChats(token);

        const socket = io(API_BASE, {
            transports: ["websocket", "polling"]
        });

        socket.on(`chat_update_${selectedChat?._id}`, (updatedChat: Chat) => {
            setSelectedChat(updatedChat);
            setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
            scrollToBottom();
        });

        socket.on('chat_updated_global', (updatedChat: Chat) => {
            setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
        });

        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);

        return () => {
            socket.disconnect();
            document.removeEventListener('click', handleClick);
        };
    }, [selectedChat?._id, router]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.messages]);

    // --- HANDLERS ---
    const handleAccept = async (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const token = localStorage.getItem('token');
        if (!token) return;
        await axios.post(`${API_BASE}/chat/${chatId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
        fetchChats(token);
    };

    const handleSend = async () => {
        if (!msgText.trim() || !selectedChat) return;
        const token = localStorage.getItem('token');

        const payload = {
            text: msgText,
            replyContext: replyingTo
        };

        await axios.post(`${API_BASE}/chat/${selectedChat._id}/message`,
            payload, { headers: { Authorization: `Bearer ${token}` } }
        );

        setMsgText('');
        setReplyingTo(null);
        if (inputRef.current) inputRef.current.style.height = 'auto';
        scrollToBottom();
    };

    const handleReplyClick = (msg: Message) => {
        const isMsgMine = msg.senderId === currentUserId;
        setReplyingTo({
            text: msg.text,
            senderName: isMsgMine ? "You" : (selectedChat?.otherUserName || "Anonymous"),
            id: msg._id || 'unknown',
            isMe: isMsgMine
        });
        inputRef.current?.focus();
    };

    const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, chatId });
    };

    const handleDeleteChat = async () => {
        if (!contextMenu) return;

        openConfirm(
            "Delete Conversation",
            "Are you sure you want to delete this conversation? This action cannot be undone.",
            async () => {
                const token = localStorage.getItem('token');

                // Optimistic logic
                const chatId = contextMenu.chatId;
                setChats(prev => prev.filter(c => c._id !== chatId));
                if (selectedChat?._id === chatId) setSelectedChat(null);

                try {
                    await axios.delete(`${API_BASE}/chat/${chatId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success("Conversation deleted");
                } catch (e) {
                    console.error("Delete failed", e);
                    toast.error("Delete failed");
                }
            },
            true
        );
    };

    const refreshInbox = () => {
        const token = localStorage.getItem('token');
        if (token) fetchChats(token);
    };

    // --- RENDER HELPERS ---
    const requests = chats.filter(c => c.status === 'pending' && c.responderId === currentUserId);
    const active = chats.filter(c => c.status === 'accepted' || (c.status === 'pending' && c.askerId === currentUserId));

    return (
        <div className="h-[100dvh] pt-[72px] sm:pt-[80px] bg-[#f8fafc] dark:bg-slate-950 font-sans relative overflow-hidden flex flex-col transition-colors duration-300">

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                isDestructive={confirmState.isDestructive}
            />

            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-orange-100/25 to-transparent dark:from-orange-950/25 dark:via-orange-900/15 dark:to-transparent"></div>

            {/* Main Layout Container - Removed Grid/Box Wrapper styling */}
            <div className="flex-1 flex relative z-10 overflow-hidden px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">

                {/* --- LEFT SIDEBAR (INBOX LIST) --- */}
                {/* Desktop: Transparent/Clean. Mobile: Full screen white. */}
                <div className={`
                    flex-col w-full md:w-[320px] lg:w-[380px] z-20 
                    transition-all duration-300 absolute md:relative inset-0 md:inset-auto md:flex md:mr-4
                    bg-white md:bg-transparent dark:bg-slate-950 md:dark:bg-transparent
                    ${selectedChat ? '-translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'translate-x-0 opacity-100'}
                `}>
                    {/* Header */}
                    <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 flex items-center justify-between sticky top-0 z-10 md:bg-transparent">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Messages</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                                {active.length} {active.length === 1 ? 'conversation' : 'conversations'}
                            </p>
                        </div>
                        <button
                            onClick={refreshInbox}
                            className={`p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-400 hover:text-[#ffb732] dark:hover:text-[#ffb732] transition-all shadow-sm touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${isRefreshing ? 'animate-spin text-[#ffb732]' : ''}`}
                        >
                            <RefreshCw size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent pb-20 md:pb-0">

                        {/* Message Requests */}
                        {requests.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">Requests</h3>
                                    <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">{requests.length}</span>
                                </div>
                                <div className="space-y-2.5">
                                    {requests.map(c => (
                                        <div key={c._id} className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-slate-900 border border-orange-100 dark:border-orange-900/30 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all group">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-200/50 dark:shadow-orange-900/30 group-hover:scale-105 transition-transform">
                                                    <User size={20} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-slate-800 dark:text-white text-base">{c.otherUserName || "Anonymous"}</h4>
                                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">wants to connect with you</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleAccept(c._id, e)}
                                                className="w-full bg-[#ffb732] dark:bg-[#ffb732] text-black py-2.5 rounded-xl text-xs font-semibold hover:bg-[#e6a42d] dark:hover:bg-[#e6a42d] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                                            >
                                                Accept Request
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages List */}
                        <div>
                            <div className="flex items-center justify-between px-2 mb-2 mt-4">
                                <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Messages</h3>
                            </div>

                            <div className="space-y-1.5">
                                {active.length === 0 ? (
                                    <div className="text-center py-20 px-6 opacity-60">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600 shadow-sm">
                                            <MessageSquare size={24} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No messages yet</p>
                                    </div>
                                ) : active.map(c => {
                                    const isSelected = selectedChat?._id === c._id;
                                    const lastMsg = c.messages[c.messages.length - 1];
                                    const isMe = lastMsg?.senderId === currentUserId;

                                    return (
                                        <div
                                            key={c._id}
                                            onClick={() => setSelectedChat(c)}
                                            onContextMenu={(e) => handleContextMenu(e, c._id)}
                                            className={`
                                            group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 border relative overflow-hidden
                                            ${isSelected
                                                    ? 'bg-white dark:bg-slate-900 border-orange-200/60 dark:border-orange-900/40 shadow-lg shadow-orange-100/50 dark:shadow-orange-950/50 scale-[1.01]'
                                                    : 'bg-transparent border-transparent hover:bg-white/70 dark:hover:bg-slate-900/70 hover:border-slate-100 dark:hover:border-slate-800/50 hover:shadow-md'}
                                        `}
                                        >
                                            <div className="relative shrink-0">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-base font-semibold transition-all ${isSelected ? 'bg-gradient-to-br from-[#ffb732] to-amber-500 text-black shadow-lg shadow-orange-300/60 dark:shadow-orange-900/60 scale-105' : 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-sm group-hover:scale-105 group-hover:border-orange-200 dark:group-hover:border-orange-900/50'}`}>
                                                    <User size={22} strokeWidth={2.5} />
                                                </div>
                                                {c.status === 'pending' && (
                                                    <span className="absolute top-0 right-0 w-3 h-3 bg-orange-400 border-2 border-white dark:border-slate-950 rounded-full"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1.5">
                                                    <h4 className={`text-base font-semibold truncate ${isSelected ? 'text-orange-900 dark:text-orange-300' : 'text-slate-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400'}`}>{c.otherUserName || "Anonymous"}</h4>
                                                    {lastMsg && (
                                                        <span className={`text-[10px] font-medium ${isSelected ? 'text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                            {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false }).replace('about ', '')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm truncate ${isSelected ? 'text-orange-700/80 dark:text-orange-300/80 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {c.status === 'pending'
                                                        ? <span className="text-amber-500 font-semibold">Request pending...</span>
                                                        : (
                                                            <span className="flex items-center gap-1.5">
                                                                {isMe && <span className="text-[10px] font-semibold px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">YOU</span>}
                                                                {lastMsg?.text || 'Start chatting'}
                                                            </span>
                                                        )
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT CHAT AREA (THE BOX) --- */}
                <div className={`
                flex-1 flex flex-col relative z-20 
                bg-white dark:bg-slate-900 
                transition-all duration-300
                absolute md:relative inset-0 md:inset-auto
                md:rounded-3xl md:shadow-xl md:border md:border-slate-100 md:dark:border-slate-800
                overflow-hidden
                ${selectedChat ? 'translate-x-0 opacity-100' : 'translate-x-full md:translate-x-0 opacity-0 md:opacity-100 md:translate-x-0'}
            `}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedChat(null)}
                                        className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffb732] to-amber-500 flex items-center justify-center text-black shadow-lg shadow-orange-300/50 dark:shadow-orange-900/50">
                                            <User size={22} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedChat.otherUserName || "Anonymous"}</h2>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleContextMenu(e, selectedChat._id)}
                                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-950/50 dark:to-slate-900/50">

                                {selectedChat.messages.map((m, i) => {
                                    const isMe = m.senderId === currentUserId;
                                    const isSystem = m.senderId === 'system';

                                    if (isSystem) return (
                                        <div key={i} className="flex justify-center my-4">
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-semibold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                                {m.text}
                                            </span>
                                        </div>
                                    );

                                    return (
                                        <div key={i} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3 fade-in duration-400`}>
                                            <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`
                                                relative px-5 py-3.5 text-[15px] leading-relaxed z-10 break-words shadow-md hover:shadow-lg transition-shadow
                                                ${isMe
                                                        ? 'bg-gradient-to-br from-[#ffb732] to-amber-500 text-black rounded-[20px] rounded-br-md'
                                                        : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-[20px] rounded-bl-md'}
                                            `}>
                                                    {/* Reply Context */}
                                                    {m.replyContext && (
                                                        <div className={`
                                                        mb-2 text-xs p-2 rounded-xl border-l-[3px] flex flex-col bg-opacity-20
                                                        ${isMe ? 'bg-black/10 border-slate-700 text-slate-900' : 'bg-slate-100 dark:bg-slate-900 border-orange-400 text-slate-600 dark:text-slate-300'}
                                                    `}>
                                                            <span className="font-semibold text-[9px] uppercase opacity-80 mb-0.5">{m.replyContext.senderName}</span>
                                                            <span className="truncate italic opacity-90 font-serif">{m.replyContext.text}</span>
                                                        </div>
                                                    )}

                                                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                                                </div>
                                                <span className={`text-[10px] font-semibold mt-2 px-1 opacity-60 ${isMe ? 'text-right' : ''} text-slate-500 dark:text-slate-400`}>
                                                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false }).replace('less than a minute', 'Just now')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} className="h-4" />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white dark:bg-slate-900 z-20 border-t border-slate-50 dark:border-slate-800">
                                <div className="max-w-4xl mx-auto w-full">
                                    {replyingTo && (
                                        <div className="flex items-center justify-between ml-4 mb-2 animate-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 relative pl-3 border-l-2 border-orange-500">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-orange-500 uppercase">Replying to {replyingTo.senderName}</p>
                                                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{replyingTo.text}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 mr-2">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-end gap-3 p-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-[24px] focus-within:ring-2 focus-within:ring-[#ffb732]/30 focus-within:border-[#ffb732] dark:focus-within:border-[#ffb732]/60 transition-all shadow-md focus-within:shadow-lg">
                                        <textarea
                                            ref={inputRef}
                                            value={msgText}
                                            onChange={(e) => { setMsgText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                            placeholder="Type your message..."
                                            rows={1}
                                            className="flex-1 bg-transparent max-h-32 min-h-[46px] py-3 px-5 text-[15px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none font-medium"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!msgText.trim()}
                                            className="p-3 bg-gradient-to-br from-[#ffb732] to-amber-500 text-black rounded-[18px] hover:from-[#e6a42d] hover:to-amber-600 disabled:opacity-40 disabled:hover:from-[#ffb732] disabled:hover:to-amber-500 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:scale-100"
                                        >
                                            <Send size={20} strokeWidth={2.5} className={msgText.trim() ? "translate-x-0.5" : ""} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-12 bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-950/80 dark:to-slate-900/80">
                            <div className="w-32 h-32 bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-[32px] shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-8 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#ffb732]/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <MessageSquare size={48} className="text-orange-300 dark:text-slate-600 relative z-10" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">No Chat Selected</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-base max-w-sm leading-relaxed">Choose a conversation from your list to start messaging.</p>
                        </div>
                    )}
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)}></div>
                        <div
                            className="fixed z-[101] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl py-1 w-48 animate-in zoom-in-95 duration-100"
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                        >
                            <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-700 mb-1">Menu</div>
                            <button
                                onClick={handleDeleteChat}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium"
                            >
                                <Trash2 size={14} /> Delete Conversation
                            </button>
                            <button
                                onClick={async () => {
                                    if (!contextMenu || !selectedChat) return;
                                    const otherId = selectedChat.askerId === currentUserId ? selectedChat.responderId : selectedChat.askerId;
                                    openConfirm(
                                        "Block User",
                                        "Block this user? They won't be able to message you anyway.",
                                        async () => {
                                            const token = localStorage.getItem('token');
                                            try {
                                                await axios.post(`${API_BASE}/users/block`, { targetId: otherId }, { headers: { Authorization: `Bearer ${token}` } });
                                                // Optimistically remove chat
                                                setChats(prev => prev.filter(c => c._id !== contextMenu.chatId));
                                                if (selectedChat._id === contextMenu.chatId) setSelectedChat(null);
                                                setContextMenu(null);
                                                toast.success("User blocked");
                                            } catch (e) { toast.error("Block failed"); }
                                        },
                                        true
                                    );
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium border-t border-slate-50 dark:border-slate-700"
                            >
                                <UserX size={14} /> Block User
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}