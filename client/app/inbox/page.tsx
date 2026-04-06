"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
    MessageSquare, X, Send, User, ChevronLeft,
    MoreVertical, Trash2,
    RefreshCw, UserX
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import getSocket from '@/lib/socket';
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
    const [showChatMenu, setShowChatMenu] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const menuBtnRef = useRef<HTMLButtonElement>(null);

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

    // Close menu when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)
            ) {
                setShowChatMenu(false);
            }
        };
        if (showChatMenu) {
            document.addEventListener('mousedown', handleOutsideClick);
            document.addEventListener('touchstart', handleOutsideClick as any);
        }
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick as any);
        };
    }, [showChatMenu]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (messagesEndRef.current) {
                const container = messagesEndRef.current.parentElement;
                if (container) {
                    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                }
            }
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

        const socket = getSocket();

        const chatEvent = `chat_update_${selectedChat?._id}`;
        if (selectedChat?._id) {
            socket.on(chatEvent, (updatedChat: Chat) => {
                setSelectedChat(updatedChat);
                setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
                scrollToBottom();
            });
        }

        socket.on('chat_updated_global', (updatedChat: Chat) => {
            setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
        });

        const handleBlockChange = () => {
            const t = localStorage.getItem('token');
            if (t) fetchChats(t);
        };
        window.addEventListener('user-blocked-changed', handleBlockChange);

        return () => {
            if (selectedChat?._id) socket.off(chatEvent);
            socket.off('chat_updated_global');
            window.removeEventListener('user-blocked-changed', handleBlockChange);
        };
    }, [selectedChat?._id, router]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.messages]);

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

    const handleDeleteChat = async (chatId: string) => {
        setShowChatMenu(false);
        openConfirm(
            "Delete Conversation",
            "Are you sure you want to delete this conversation? This action cannot be undone.",
            async () => {
                const token = localStorage.getItem('token');
                setChats(prev => prev.filter(c => c._id !== chatId));
                if (selectedChat?._id === chatId) setSelectedChat(null);
                try {
                    await axios.delete(`${API_BASE}/chat/${chatId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success("Conversation deleted");
                } catch (e) {
                    toast.error("Delete failed");
                }
            },
            true
        );
    };

    const handleBlockUser = (chatId: string) => {
        if (!selectedChat) return;
        setShowChatMenu(false);
        const otherId = selectedChat.askerId === currentUserId ? selectedChat.responderId : selectedChat.askerId;
        openConfirm(
            "Block User",
            "Block this user? They won't be able to message you.",
            async () => {
                const token = localStorage.getItem('token');
                try {
                    await axios.post(`${API_BASE}/users/block`, { targetId: otherId }, { headers: { Authorization: `Bearer ${token}` } });
                    setChats(prev => prev.filter(c => c._id !== chatId));
                    if (selectedChat._id === chatId) setSelectedChat(null);
                    toast.success("User blocked");
                    window.dispatchEvent(new CustomEvent('user-blocked-changed'));
                    window.dispatchEvent(new Event('user-updated'));
                } catch (e) { toast.error("Block failed"); }
            },
            true
        );
    };

    const refreshInbox = () => {
        const token = localStorage.getItem('token');
        if (token) fetchChats(token);
    };

    const requests = chats.filter(c => c.status === 'pending' && c.responderId === currentUserId);
    const active = chats.filter(c => c.status === 'accepted' || (c.status === 'pending' && c.askerId === currentUserId));

    return (
        <div className="h-[100dvh] pt-[64px] sm:pt-[72px] bg-[#f8fafc] dark:bg-slate-950 font-sans relative overflow-hidden flex flex-col transition-colors duration-300">

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                isDestructive={confirmState.isDestructive}
            />

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-orange-50/40 via-transparent to-transparent dark:from-orange-950/20 dark:to-transparent" />

            {/* Main Layout */}
            <div className="flex-1 flex relative z-10 overflow-hidden md:px-6 md:pb-6 md:gap-4">

                {/* LEFT SIDEBAR */}
                <div className={`
                    flex flex-col w-full md:w-[340px] lg:w-[380px] flex-shrink-0
                    bg-white dark:bg-slate-950 md:bg-transparent md:dark:bg-transparent
                    absolute md:relative inset-0 md:inset-auto z-20
                    transition-transform duration-300 ease-in-out
                    ${selectedChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
                `}>
                    {/* Sidebar Header */}
                    <div className="px-4 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 md:border-0 md:pt-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Messages</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {active.length} {active.length === 1 ? 'conversation' : 'conversations'}
                            </p>
                        </div>
                        <button
                            onClick={refreshInbox}
                            className={`p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#ffb732] transition-all touch-manipulation ${isRefreshing ? 'animate-spin text-[#ffb732]' : ''}`}
                        >
                            <RefreshCw size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 pb-24 md:pb-4">

                        {/* Requests */}
                        {requests.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Requests · {requests.length}</p>
                                <div className="space-y-2">
                                    {requests.map(c => (
                                        <div key={c._id} className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-slate-900 border border-orange-100 dark:border-orange-900/30 p-4 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ffb732] to-amber-500 flex items-center justify-center text-black shadow-md flex-shrink-0">
                                                    <User size={18} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{c.otherUserName || "Anonymous"}</h4>
                                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">wants to connect</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleAccept(c._id, e)}
                                                className="w-full bg-[#ffb732] text-black py-2.5 rounded-xl text-sm font-bold hover:bg-[#e6a42d] transition-all active:scale-95 touch-manipulation"
                                            >
                                                Accept Request
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Chats</p>
                        {active.length === 0 ? (
                            <div className="text-center py-16 px-6 opacity-60">
                                <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-600 shadow-sm">
                                    <MessageSquare size={22} />
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
                                    className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border touch-manipulation
                                        ${isSelected
                                            ? 'bg-white dark:bg-slate-900 border-orange-200/60 dark:border-orange-900/40 shadow-md'
                                            : 'bg-transparent border-transparent hover:bg-white/80 dark:hover:bg-slate-900/60 hover:border-slate-100 dark:hover:border-slate-800 active:bg-white dark:active:bg-slate-900'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                                        ${isSelected
                                            ? 'bg-gradient-to-br from-[#ffb732] to-amber-500 text-black shadow-md'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>
                                        <User size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-orange-800 dark:text-orange-300' : 'text-slate-900 dark:text-white'}`}>
                                                {c.otherUserName || "Anonymous"}
                                            </h4>
                                            {lastMsg && (
                                                <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">
                                                    {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false }).replace('about ', '').replace('less than a minute', 'now')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {c.status === 'pending'
                                                ? <span className="text-amber-500 font-semibold">Request pending...</span>
                                                : <>{isMe && <span className="font-semibold">You: </span>}{lastMsg?.text || 'Start chatting'}</>
                                            }
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT CHAT AREA */}
                <div className={`
                    flex-1 flex flex-col
                    bg-white dark:bg-slate-900
                    absolute md:relative inset-0 md:inset-auto z-20
                    md:rounded-2xl md:shadow-lg md:border md:border-slate-100 md:dark:border-slate-800
                    overflow-hidden transition-transform duration-300 ease-in-out
                    ${selectedChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0 shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        onClick={() => { setSelectedChat(null); setShowChatMenu(false); }}
                                        className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors touch-manipulation flex-shrink-0"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb732] to-amber-500 flex items-center justify-center text-black flex-shrink-0 shadow-sm">
                                        <User size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{selectedChat.otherUserName || "Anonymous"}</h2>
                                        {selectedChat.otherUserName && (
                                            <p 
                                                onClick={() => {
                                                    const otherId = selectedChat.askerId === currentUserId ? selectedChat.responderId : selectedChat.askerId;
                                                    router.push(`/profile/${otherId}`);
                                                }}
                                                className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:underline"
                                            >
                                                tap to view profile
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* THREE DOTS MENU - Properly implemented */}
                                <div className="relative flex-shrink-0">
                                    <button
                                        ref={menuBtnRef}
                                        onClick={() => setShowChatMenu(prev => !prev)}
                                        className={`p-2.5 rounded-xl transition-colors touch-manipulation flex-shrink-0
                                            ${showChatMenu
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        aria-label="Chat options"
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showChatMenu && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl overflow-hidden z-50"
                                        >
                                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chat Options</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteChat(selectedChat._id)}
                                                className="w-full text-left px-4 py-3.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 flex items-center gap-3 font-semibold transition-colors touch-manipulation"
                                            >
                                                <Trash2 size={16} />
                                                Delete Conversation
                                            </button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700" />
                                            <button
                                                onClick={() => handleBlockUser(selectedChat._id)}
                                                className="w-full text-left px-4 py-3.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 flex items-center gap-3 font-semibold transition-colors touch-manipulation"
                                            >
                                                <UserX size={16} />
                                                Block User
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
                                {selectedChat.messages.map((m, i) => {
                                    const isMe = m.senderId === currentUserId;
                                    const isSystem = m.senderId === 'system';

                                    if (isSystem) return (
                                        <div key={i} className="flex justify-center my-2">
                                            <span className="bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-semibold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {m.text}
                                            </span>
                                        </div>
                                    );

                                    return (
                                        <div key={i} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`
                                                    px-4 py-3 text-[14px] leading-relaxed break-words shadow-sm
                                                    ${isMe
                                                        ? 'bg-gradient-to-br from-[#ffb732] to-amber-500 text-black rounded-[18px] rounded-br-sm'
                                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-[18px] rounded-bl-sm'
                                                    }`}
                                                >
                                                    {m.replyContext && (
                                                        <div className={`mb-2 text-xs p-2 rounded-xl border-l-[3px] ${isMe ? 'bg-black/10 border-slate-700 text-slate-900' : 'bg-slate-50 dark:bg-slate-900 border-orange-400 text-slate-600 dark:text-slate-300'}`}>
                                                            <span className="font-bold text-[9px] uppercase opacity-70 block mb-0.5">{m.replyContext.senderName}</span>
                                                            <span className="truncate italic opacity-80 block">{m.replyContext.text}</span>
                                                        </div>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{m.text}</p>
                                                </div>
                                                <span className="text-[10px] mt-1 px-1 text-slate-400 dark:text-slate-500">
                                                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false }).replace('less than a minute', 'Just now')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} className="h-2" />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 pb-24 md:pb-[max(12px,env(safe-area-inset-bottom))] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                                {replyingTo && (
                                    <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-l-2 border-orange-400 mx-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-orange-500 uppercase">Replying to {replyingTo.senderName}</p>
                                            <p className="text-xs text-slate-400 truncate max-w-[220px]">{replyingTo.text}</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-slate-600 touch-manipulation">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-end gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:border-[#ffb732] focus-within:ring-2 focus-within:ring-[#ffb732]/20 transition-all">
                                    <textarea
                                        ref={inputRef}
                                        value={msgText}
                                        onChange={(e) => { setMsgText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="flex-1 bg-transparent max-h-[120px] min-h-[40px] py-2 px-3 text-[15px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!msgText.trim()}
                                        className="p-2.5 bg-gradient-to-br from-[#ffb732] to-amber-500 text-black rounded-xl hover:from-[#e6a42d] hover:to-amber-600 disabled:opacity-40 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:scale-100 touch-manipulation flex-shrink-0"
                                    >
                                        <Send size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-12 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                            <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-6">
                                <MessageSquare size={40} className="text-orange-300 dark:text-slate-600" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Chat Selected</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Choose a conversation from your list to start messaging.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}