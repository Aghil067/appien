"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { usePathname } from 'next/navigation';
import { User, MessageSquarePlus, Settings, LayoutGrid, LucideIcon, Bell, MessageSquare, CheckCircle, MessageCircle, Home, Heart } from 'lucide-react';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';

import API_BASE from '@/lib/api';

interface NavItemProps {
    href: string;
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    mobile?: boolean;
}

interface Notification {
    _id: string;
    recipientId: string;
    type: 'REPLY' | 'HELPFUL' | 'CHAT_REQUEST' | 'NEW_QUESTION' | 'THANK_YOU';
    text: string;
    isRead: boolean;
    createdAt: string;
}

const NavItem = ({ href, icon: Icon, label, isActive, mobile }: NavItemProps) => {
    return (
        <Link
            href={href}
            className={mobile
                ? `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-300 ${isActive ? 'text-[#ffb732] dark:text-[#ffb732]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`
                : `flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 text-sm font-medium ${isActive ? 'bg-[#ffb732] text-black shadow-md shadow-orange-200/60 dark:shadow-orange-900/60' : 'text-gray-600 dark:text-gray-400 hover:bg-white/90 dark:hover:bg-slate-800/70 hover:text-orange-600 dark:hover:text-[#ffb732] hover:shadow-sm'}`
            }
        >
            <Icon size={mobile ? 24 : 18} strokeWidth={mobile && isActive ? 2.5 : 2} className={`transition-transform duration-300 ${mobile && isActive ? 'scale-110' : ''}`} />
            {mobile && <span className="text-[10px] font-medium">{label}</span>}
            {!mobile && <span>{label}</span>}
        </Link>
    );
};

export default function Navbar() {
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    const [isPrivate, setIsPrivate] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- 1. INITIAL DATA FETCH & LISTENER ---
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUserId(null);
            setUsername('');
            setIsPrivate(false);
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        try {
            const userRes = await axios.get(`${API_BASE}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserId(userRes.data._id);
            setUsername(userRes.data.username || 'User');
            setIsPrivate(userRes.data.settings?.isPrivate || false);

            const notifRes = await axios.get(`${API_BASE}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifRes.data);
            setUnreadCount(notifRes.data.filter((n: Notification) => !n.isRead).length);
        } catch (e) {
            console.error("Failed to load navbar data");
        }
    };

    useEffect(() => {
        fetchData();

        // Listen for updates from Settings/Profile pages
        window.addEventListener('user-updated', fetchData);
        return () => {
            window.removeEventListener('user-updated', fetchData);
        };
    }, []);

    // --- 2. REAL-TIME SOCKET LISTENER ---
    useEffect(() => {
        if (!userId) return;
        const socket = io(API_BASE);

        // Join my private room
        socket.emit('join_user', userId);

        // Listen for generic event sent to my room
        socket.on('notification', (newNotif: Notification) => {
            // Ensure ID comparison works even if types mismatch
            if (String(newNotif.recipientId) === String(userId)) {
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        });

        return () => { socket.disconnect(); };
    }, [userId]);

    // --- 3. HANDLERS ---
    const handleToggleNotifications = async () => {
        if (!showDropdown) {
            setUnreadCount(0);
            setShowDropdown(true);

            const token = localStorage.getItem('token');
            if (token) {
                await axios.post(`${API_BASE}/notifications/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } else {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (pathname === '/login') return null;

    return (
        <>
            {/* --- DESKTOP TOP BAR (Glassmorphism) --- */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-800/60 shadow-sm supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-900/70 transition-all duration-300">
                <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between relative">

                    {/* Logo Area */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-14 w-40 md:h-16 md:w-48 transition-transform duration-300 group-hover:scale-105">
                            <div className="relative w-full h-full">
                                <Image
                                    src="/appien-logo.png"
                                    alt="Appien"
                                    fill
                                    className="object-contain mix-blend-multiply dark:hidden"
                                    priority
                                />
                                <div
                                    className="hidden dark:block w-full h-full bg-[#ffb732]"
                                    style={{
                                        maskImage: 'url(/appien-logo.png)',
                                        maskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                        WebkitMaskImage: 'url(/appien-logo.png)',
                                        WebkitMaskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center'
                                    }}
                                />
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Navigation Pills */}
                    <nav className="hidden md:flex items-center gap-1 bg-gray-50/80 dark:bg-slate-800/60 backdrop-blur-md p-1.5 rounded-full border border-gray-200/50 dark:border-slate-700/60 shadow-sm">
                        <NavItem href="/" icon={Home} label="Home" isActive={pathname === '/'} />
                        <NavItem href="/inbox" icon={MessageSquare} label="Inbox" isActive={pathname === '/inbox'} />
                        <NavItem href="/profile" icon={User} label="Profile" isActive={pathname === '/profile'} />
                        <NavItem href="/settings" icon={Settings} label="Settings" isActive={pathname === '/settings'} />
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 md:gap-6" ref={dropdownRef}>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={handleToggleNotifications}
                                className={`relative p-2.5 text-gray-400 dark:text-gray-500 hover:text-[#ffb732] dark:hover:text-[#ffb732] transition-all duration-300 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/30 group ${showDropdown ? 'bg-orange-50 dark:bg-orange-900/30 text-[#ffb732] dark:text-[#ffb732] scale-105' : ''}`}
                            >
                                <Bell size={22} className={showDropdown ? "fill-orange-600 dark:fill-orange-400" : ""} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"></span>
                                )}
                            </button>

                            {/* DROPDOWN (Animated) */}
                            {showDropdown && (
                                <div className="absolute right-[-60px] md:right-0 mt-4 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-orange-100/50 dark:shadow-orange-950/50 border border-gray-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300 z-[60]">
                                    <div className="p-4 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center backdrop-blur-sm">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">Notifications</h4>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-gray-100 dark:border-slate-700 shadow-sm">Recent</span>
                                    </div>
                                    <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600"><Bell size={20} /></div>
                                                <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">No new notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map((n, i) => (
                                                <div key={i} className="p-4 border-b border-gray-50 dark:border-slate-800 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors flex gap-3 cursor-pointer group">
                                                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${n.type === 'THANK_YOU' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' :
                                                        n.type === 'HELPFUL' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                            'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                                        }`}>
                                                        {n.type === 'THANK_YOU' ? <Heart size={16} className="fill-pink-600 dark:fill-pink-400" /> :
                                                            n.type === 'HELPFUL' ? <CheckCircle size={16} className="fill-emerald-100 dark:fill-emerald-900/30" /> :
                                                                <MessageCircle size={16} className="fill-orange-100 dark:fill-orange-900/30" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{n.text}</p>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">{formatDistanceToNow(new Date(n.createdAt))} ago</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 text-center">
                                        <button onClick={() => setShowDropdown(false)} className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:text-orange-800 dark:hover:text-orange-300 hover:underline transition-colors">Close</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Pill (Desktop) */}
                        <Link href="/profile" className="hidden md:flex items-center gap-3 pl-6 border-l border-gray-200/60 dark:border-slate-700/60 hover:opacity-80 transition-opacity group">
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{username || 'You'}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">{isPrivate ? 'Private' : 'Public'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-900/50 border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center text-orange-600 dark:text-orange-400 font-extrabold text-sm group-hover:scale-105 transition-transform">{(username || 'U')[0].toUpperCase()}</div>
                        </Link>

                        {/* Mobile Profile Icon */}
                        <Link href="/profile" className="md:hidden w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-900/50 border border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">{(username || 'U')[0].toUpperCase()}</Link>
                    </div>
                </div>
            </header>

            {/* --- MOBILE BOTTOM NAVIGATION BAR (Floating & Modern) --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800/50 pb-safe z-50 flex justify-around items-center h-20 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-t-3xl">
                <NavItem href="/" icon={Home} label="Home" mobile isActive={pathname === '/'} />
                <NavItem href="/inbox" icon={MessageSquare} label="Inbox" mobile isActive={pathname === '/inbox'} />
                <NavItem href="/settings" icon={Settings} label="Settings" mobile isActive={pathname === '/settings'} />
            </div>
        </>
    );
}