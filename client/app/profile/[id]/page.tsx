"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { User, MessageSquare, Calendar, Phone, LogOut, Shield, MapPin, MessageCircle, CornerDownRight, Clock, Loader2, ChevronLeft } from 'lucide-react';
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
    picture?: string;
    location?: string;
    isTrusted?: boolean;
}

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [userQuestions, setUserQuestions] = useState<Question[]>([]);
    const [userAnswers, setUserAnswers] = useState<MyAnswer[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'asked' | 'answered'>('asked');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        if (!id) return;

        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/users/public/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data.profile);
                setUserQuestions(res.data.asked || []);
                setUserAnswers(res.data.answered || []);
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                     setErrorMsg(error.response?.data?.error || "Could not load profile");
                }
                console.error("Error loading profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-orange-600 dark:text-orange-400" size={32} />
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950 text-center px-4">
                <Shield size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{errorMsg}</h2>
                <button onClick={() => router.back()} className="text-[#ffb732] font-semibold hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-[100dvh] bg-[#F8FAFC] dark:bg-slate-950 pb-24 md:pb-8 font-sans relative transition-colors duration-300">

            {/* Background Mesh - Fixed */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50/70 to-transparent dark:from-orange-950/25 pointer-events-none z-0"></div>

            <div className="max-w-5xl mx-auto relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24">
                <div className="flex items-center gap-4 mb-5 sm:mb-6 animate-in slide-in-from-top-4 duration-500">
                    <button onClick={() => router.back()} className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">User Profile</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 items-start">

                    {/* LEFT: User Info Card */}
                    <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 animate-in slide-in-from-left-4 duration-700">
                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] sm:rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none border border-white dark:border-slate-800 overflow-hidden relative group hover:shadow-[0_8px_40px_rgba(249,115,22,0.08)] dark:hover:shadow-none transition-all duration-300">
                            {/* Header Gradient */}
                            <div className="absolute top-0 left-0 w-full h-20 bg-[#ffb732] relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>

                            {/* Profile Image */}
                            <div className="relative z-10 pt-10 text-center -mt-20"> 
                                <div className="mt-10 w-24 h-24 bg-white dark:bg-slate-800 p-1.5 rounded-full mx-auto shadow-md shadow-orange-200/50 dark:shadow-none relative">
                                    {profile.picture ? (
                                        <img src={profile.picture} alt="Profile" className="w-full h-full rounded-full object-cover border border-slate-100 dark:border-slate-700" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 text-3xl font-bold border border-slate-100 dark:border-slate-700">
                                            {profile.username ? profile.username[0].toUpperCase() : <User />}
                                        </div>
                                    )}
                                    {profile.isTrusted && (
                                        <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-800 shadow-md" title="Trusted User">
                                            <Shield size={12} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-center px-4 sm:px-5 md:px-6 pb-5 sm:pb-6 pt-3">
                                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-0.5">{profile.username}</h2>
                                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-6 mt-2 border border-slate-200 dark:border-slate-700">
                                    <MapPin size={10} /> {profile.location || "Location not set"}
                                </div>

                                <div className="flex items-center justify-around pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-orange-600 dark:text-[#ffb732]">{userQuestions.length}</p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider">Asked</p>
                                    </div>
                                    <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-orange-600 dark:text-[#ffb732]">{userAnswers.length}</p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider">Answered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Activity Feed */}
                    <div className="lg:col-span-8 animate-in slide-in-from-right-4 duration-700 delay-100">
                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none border border-white dark:border-slate-800 flex flex-col lg:h-[calc(100dvh-200px)] min-h-[500px]">

                            {/* Tabs Header */}
                            <div className="p-1 md:p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 md:gap-2 bg-slate-50/80 dark:bg-slate-800/80 mx-2 my-2 md:m-4 rounded-xl md:rounded-2xl shrink-0 sticky top-[80px] lg:top-0 z-20 backdrop-blur-md">
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
                            <div className="flex-1 lg:overflow-y-auto p-4 sm:p-6 pt-2 space-y-4 pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">

                                {/* VIEW: QUESTIONS ASKED */}
                                {activeTab === 'asked' && (
                                    userQuestions.length > 0 ? (
                                        userQuestions.map((q, i) => (
                                            <div key={q._id} onClick={() => router.push(`/#question-${q._id}`)} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] hover:border-orange-100 dark:hover:border-orange-900 hover:shadow-md dark:hover:shadow-none transition-all duration-200 group cursor-pointer">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base leading-snug group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors line-clamp-2 pr-2">{q.text}</h3>
                                                    <span className="flex-shrink-0 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-orange-100 dark:border-orange-800">
                                                        <MessageSquare size={12} /> {q.answers?.length || 0}
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
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60 min-h-[200px]">
                                            <MessageSquare size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">No questions asked yet.</p>
                                        </div>
                                    )
                                )}

                                {/* VIEW: ANSWERS GIVEN */}
                                {activeTab === 'answered' && (
                                    userAnswers.length > 0 ? (
                                        userAnswers.map((a, i) => (
                                            <div key={i} onClick={() => router.push(`/#question-${a._id}`)} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] hover:border-amber-100 dark:hover:border-amber-900 hover:shadow-md dark:hover:shadow-none transition-all duration-200 group cursor-pointer">

                                                {/* Question Context */}
                                                <div className="mb-4 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                                        <CornerDownRight size={12} className="text-slate-300 dark:text-slate-600" /> Replied to
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
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60 min-h-[200px]">
                                            <MessageCircle size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">No answers given yet.</p>
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
