"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User, MessageSquare, Calendar, Phone, LogOut, Shield, MapPin, Edit2, MessageCircle, CornerDownRight, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import API_BASE from '@/lib/api';

// --- Types ---
interface Answer {
    text: string;
    responderName: string;
    createdAt: string;
}

interface Question {
    _id: string;
    text: string;
    createdAt: string;
    answers: Answer[];
}

interface MyAnswer {
    _id: string; // Question ID
    questionText: string;
    answerText: string;
    createdAt: string;
}

interface UserProfile {
    _id: string;
    username: string;
    phoneNumber: string;
    location?: string;
}

export default function ProfilePage() {
    const [myQuestions, setMyQuestions] = useState<Question[]>([]);
    const [myAnswers, setMyAnswers] = useState<MyAnswer[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'asked' | 'answered'>('asked');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('darkMode');
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch User Profile
                const profileRes = await axios.get(`${API_BASE}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(profileRes.data);

                // 2. Fetch User Activity (Asked & Answered)
                const activityRes = await axios.get(`${API_BASE}/users/activity`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyQuestions(activityRes.data.asked);
                setMyAnswers(activityRes.data.answered);
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('darkMode');
                    router.push('/login');
                    return;
                }
                console.error("Error loading profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-orange-600 dark:text-orange-400" size={32} />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-[100dvh] bg-[#F8FAFC] dark:bg-slate-950 pb-24 md:pb-8 font-sans relative transition-colors duration-300">

            {/* Background Mesh - Fixed */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50/70 to-transparent dark:from-orange-950/25 pointer-events-none z-0"></div>

            <div className="max-w-5xl mx-auto relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24">
                <div className="flex items-center justify-between mb-5 sm:mb-6 animate-in slide-in-from-top-4 duration-500">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
                    <button onClick={() => router.push('/settings')} className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 bg-white dark:bg-slate-900 px-3 sm:px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 border border-orange-50 dark:border-slate-800 touch-manipulation min-h-[40px]">
                        <Edit2 size={12} /> <span className="hidden sm:inline">Edit</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 items-start">

                    {/* LEFT: User Info Card (Sticky on Desktop) */}
                    <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 animate-in slide-in-from-left-4 duration-700">
                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] sm:rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none border border-white dark:border-slate-800 overflow-hidden relative group hover:shadow-[0_8px_40px_rgba(249,115,22,0.08)] dark:hover:shadow-none transition-all duration-300">
                            {/* Header Gradient */}
                            <div className="absolute top-0 left-0 w-full h-20 bg-[#ffb732] relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>

                            {/* Profile Image */}
                            <div className="relative z-10 pt-10 text-center -mt-20"> {/* Adjusted margin to pull up */}
                                <div className="mt-10 w-24 h-24 bg-white dark:bg-slate-800 p-1.5 rounded-full mx-auto shadow-md shadow-orange-200/50 dark:shadow-none">
                                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 text-3xl font-bold border border-slate-100 dark:border-slate-700">
                                        {profile.username ? profile.username[0].toUpperCase() : <User />}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center px-4 sm:px-5 md:px-6 pb-5 sm:pb-6 pt-3">
                                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-0.5">{profile.username}</h2>
                                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                                    <Phone size={12} className="text-orange-400" /> {profile.phoneNumber}
                                </div>
                                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-6 mt-2 border border-slate-200 dark:border-slate-700">
                                    <MapPin size={10} /> {profile.location || "Location not set"}
                                </div>

                                <div className="flex items-center justify-around pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-orange-600 dark:text-[#ffb732]">{myQuestions.length}</p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider">Asked</p>
                                    </div>
                                    <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-orange-600 dark:text-[#ffb732]">{myAnswers.length}</p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider">Answered</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border border-red-50 dark:border-red-900/30 text-red-500 dark:text-red-400 font-semibold text-xs hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 hover:border-red-100 dark:hover:border-red-900/50 transition-all flex items-center justify-center gap-2 group shadow-sm dark:shadow-none active:scale-95"
                        >
                            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> Logout
                        </button>
                    </div>

                    {/* RIGHT: Activity Feed (Static Height with Scroll) */}
                    <div className="lg:col-span-8 animate-in slide-in-from-right-4 duration-700 delay-100">
                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none border border-white dark:border-slate-800 flex flex-col h-[calc(100dvh-200px)]">

                            {/* Tabs Header */}
                            <div className="p-1 md:p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 md:gap-2 bg-slate-50/80 dark:bg-slate-800/80 mx-2 my-2 md:m-4 rounded-xl md:rounded-2xl shrink-0 sticky top-0 z-20 backdrop-blur-md">
                                <button
                                    onClick={() => setActiveTab('asked')}
                                    className={`flex-1 py-4 text-center text-sm font-semibold transition-all flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap ${activeTab === 'asked'
                                        ? 'text-orange-700 dark:text-[#ffb732] border-b-2 border-orange-600 dark:border-[#ffb732] bg-orange-50/50 dark:bg-orange-900/20'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/30 dark:hover:bg-orange-900/10'}`}
                                >
                                    <MessageSquare size={14} className="md:w-4 md:h-4 shrink-0" /> Questions <span className="hidden sm:inline">Asked</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('answered')}
                                    className={`flex-1 py-4 text-center text-sm font-semibold transition-all flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap ${activeTab === 'answered'
                                        ? 'text-orange-700 dark:text-[#ffb732] border-b-2 border-orange-600 dark:border-[#ffb732] bg-orange-50/50 dark:bg-orange-900/20'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/30 dark:hover:bg-orange-900/10'}`}
                                >
                                    <MessageCircle size={14} className="md:w-4 md:h-4 shrink-0" /> Answers <span className="hidden sm:inline">Given</span>
                                </button>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4 pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">

                                {/* VIEW: QUESTIONS ASKED */}
                                {activeTab === 'asked' && (
                                    myQuestions.length > 0 ? (
                                        myQuestions.map((q, i) => (
                                            <div key={q._id} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] hover:border-orange-100 dark:hover:border-orange-900 hover:shadow-md dark:hover:shadow-none transition-all duration-200 group cursor-default">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base leading-snug group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors line-clamp-2 pr-2">{q.text}</h3>
                                                    <span className="flex-shrink-0 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-orange-100 dark:border-orange-800">
                                                        <MessageSquare size={12} /> {q.answers.length}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                                        <Calendar size={12} className="text-slate-400 dark:text-slate-500" /> {formatDistanceToNow(new Date(q.createdAt))} ago
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                            <MessageSquare size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">No questions asked yet.</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Start engaging with your community!</p>
                                        </div>
                                    )
                                )}

                                {/* VIEW: ANSWERS GIVEN */}
                                {activeTab === 'answered' && (
                                    myAnswers.length > 0 ? (
                                        myAnswers.map((a, i) => (
                                            <div key={i} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] hover:border-amber-100 dark:hover:border-amber-900 hover:shadow-md dark:hover:shadow-none transition-all duration-200 group cursor-default">

                                                {/* Question Context */}
                                                <div className="mb-4 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                                        <CornerDownRight size={12} className="text-slate-300 dark:text-slate-600" /> You replied to
                                                    </span>
                                                    <h3 className="font-medium text-slate-600 dark:text-slate-300 text-sm leading-snug line-clamp-1">
                                                        {a.questionText || "Question unavailable"}
                                                    </h3>
                                                </div>

                                                {/* Answer Bubble */}
                                                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl rounded-tl-none border border-amber-100 dark:border-amber-900/30 flex gap-3 items-start">
                                                    <div className="bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 rounded-full p-1.5 shrink-0 shadow-sm border border-amber-100 dark:border-slate-700 mt-0.5">
                                                        <MessageCircle size={14} strokeWidth={2.5} />
                                                    </div>
                                                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed break-words">
                                                        {a.answerText}
                                                    </p>
                                                </div>

                                                {/* Timestamp */}
                                                <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide px-2">
                                                    <Clock size={12} /> {formatDistanceToNow(new Date(a.createdAt))} ago
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                            <MessageCircle size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">No answers given yet.</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Help others in your community!</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}