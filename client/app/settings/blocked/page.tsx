"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Unlock, ShieldAlert, CheckCircle2 } from 'lucide-react';

import API_BASE from '@/lib/api';

interface BlockedUser {
    _id: string;
    username: string;
}

export default function BlockedUsersPage() {
    const [blocked, setBlocked] = useState<BlockedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        fetchBlocked(token);
    }, [router]);

    const fetchBlocked = async (token: string) => {
        try {
            const res = await axios.get(`${API_BASE}/api/users/blocked`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlocked(res.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleUnblock = async (targetId: string) => {
        const token = localStorage.getItem('token');
        await axios.post(`${API_BASE}/api/users/unblock`,
            { targetId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        // Refresh list
        setBlocked(prev => prev.filter(u => u._id !== targetId));
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pt-20 pb-24 md:pt-28 px-4 md:px-8 transition-colors duration-300">
            <div className="max-w-xl mx-auto w-full">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-full text-slate-600 dark:text-slate-400 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Blocked Accounts</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">Manage who you&apos;ve restricted</p>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <div className="w-8 h-8 border-2 border-orange-600 dark:border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-600 animate-pulse">Loading list...</p>
                    </div>
                ) : blocked.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-slate-900 dark:text-slate-100 font-semibold text-base mb-1">All Clear!</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                            You haven&apos;t blocked anyone yet. Your conversations are flowing freely.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {blocked.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-orange-100 dark:hover:border-orange-900/50 group">
                                <div className="flex items-center gap-3.5">
                                    <div className="relative">
                                        <div className="w-11 h-11 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl flex items-center justify-center text-red-500 dark:text-red-400 font-semibold text-sm border border-red-100 dark:border-red-900/30 shadow-inner">
                                            {user.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                                            <ShieldAlert size={12} className="text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-900/20" />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-orange-900 dark:group-hover:text-orange-400 transition-colors">
                                            {user.username || "Unknown User"}
                                        </span>
                                        <span className="text-[10px] text-red-400 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit mt-0.5">
                                            Blocked
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUnblock(user._id)}
                                    className="pl-4 pr-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 group/btn"
                                >
                                    <span>Unblock</span>
                                    <div className="bg-white dark:bg-slate-900 group-hover/btn:bg-orange-50 dark:group-hover/btn:bg-orange-900/50 p-1 rounded-full shadow-sm transition-colors">
                                        <Unlock size={12} />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}