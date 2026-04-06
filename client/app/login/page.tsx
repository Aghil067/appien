"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, MapPin, Shield } from 'lucide-react';
import Image from 'next/image';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';

import API_BASE from '@/lib/api';

export default function LoginPage() {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [location, setLocation] = useState('HSR');
    const [existingName, setExistingName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/google`, { 
                credential: credentialResponse.credential 
            });
            
            localStorage.setItem('token', res.data.token);
            sessionStorage.setItem('showNotificationPromptOnFirstQuestion', 'true');
            window.dispatchEvent(new Event('user-updated'));
            
            if (res.data.isNewUser) {
                setStep(2);
            } else {
                setExistingName(res.data.username);
                router.push('/');
            }
        } catch (e) {
            alert("Failed to authenticate with Google.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteProfile = async () => {
        if (!username || username.length < 3) return alert("Please enter a valid username");
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE}/users/settings`, {
                username,
                location
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            sessionStorage.setItem('showNotificationPromptOnFirstQuestion', 'true');
            window.dispatchEvent(new Event('user-updated'));
            router.push('/');
        } catch (e) {
            alert("Failed to update profile. Username might be taken.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
        <div className="flex flex-col min-h-[100dvh] bg-[#F8FAFC] dark:bg-slate-950 relative overflow-x-hidden transition-colors duration-300">

            {/* Background Gradient Mesh - Desktop */}
            <div className="hidden lg:block fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50/70 to-transparent dark:from-orange-950/25 pointer-events-none z-0"></div>
            
            {/* Background Glowing Orbs - Mobile only */}
            <div className="lg:hidden fixed top-[-10%] left-[-10%] w-[350px] h-[350px] bg-gradient-to-b from-orange-300/30 to-amber-300/10 dark:from-orange-600/20 dark:to-orange-900/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
            <div className="lg:hidden fixed bottom-[20%] right-[-20%] w-[300px] h-[300px] bg-[#ffb732]/20 dark:bg-[#ffb732]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* --- NAVBAR --- */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full px-5 py-4 md:px-8 md:py-6 flex justify-between items-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-b border-black/5 dark:border-white/5 transition-colors">
                <div className="relative h-9 w-28 md:h-12 md:w-36 transition-transform duration-300 hover:scale-105 cursor-pointer origin-left">
                    <div className="relative w-full h-full">
                        <Image
                            src="/appien-logo.png"
                            alt="Appien"
                            fill
                            sizes="(max-width: 768px) 112px, 144px"
                            className="object-contain mix-blend-multiply dark:hidden object-left"
                            priority
                        />
                        <div
                            className="hidden dark:block w-full h-full bg-[#ffb732]"
                            style={{
                                maskImage: 'url(/appien-logo.png)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'left center',
                                WebkitMaskImage: 'url(/appien-logo.png)',
                                WebkitMaskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'left center'
                            }}
                        />
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col justify-center items-center w-full z-10 px-4 md:px-8 lg:px-12 pt-[80px] md:pt-[104px] pb-8 md:pb-12 min-h-[100dvh]">

                {/* THE CONTAINER - Full width/invisible on Mobile, Card on Desktop */}
                <div className="w-full lg:max-w-[1100px] flex flex-col lg:flex-row lg:bg-white/80 lg:dark:bg-slate-900/70 lg:backdrop-blur-xl lg:rounded-[36px] shadow-none lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:lg:shadow-none lg:border lg:border-white/60 dark:lg:border-slate-800 lg:overflow-hidden min-h-[auto] lg:min-h-[680px] relative transition-all duration-500 my-auto flex-1 lg:flex-initial">

                    {/* LEFT PANEL: Visuals (Desktop Only) */}
                    <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative flex-col justify-between p-14 text-white overflow-hidden shadow-[inset_-10px_0_30px_rgba(0,0,0,0.2)]">
                        {/* Internal Glows */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#ffb732]/30 to-amber-600/10 rounded-full blur-[120px] -mr-32 -mt-32 mix-blend-screen pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/20 rounded-full blur-[120px] -ml-20 -mb-20 mix-blend-screen pointer-events-none"></div>

                        <div className="relative z-10 animate-in slide-in-from-left-8 duration-700 fade-in pt-8">
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold tracking-widest text-[#ffb732] uppercase mb-10 backdrop-blur-md shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                </span>
                                <span>Live Activity Nearby</span>
                            </div>
                            <h2 className="text-[52px] leading-[1.1] font-black mb-6 tracking-tight text-white drop-shadow-md">
                                Discover where<br />
                                to hang out, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffb732] to-amber-300 drop-shadow-none">locally.</span>
                            </h2>
                            <p className="text-slate-300 text-[17px] leading-relaxed max-w-md font-medium mb-12">
                                Connect with your exact neighborhood. Ask locals what places are calm, crowded, or worth visiting right now.
                            </p>

                            <div className="space-y-4 max-w-md">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-default group">
                                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#ffb732]/20 to-[#ffb732]/5 rounded-xl text-[#ffb732] border border-[#ffb732]/20 group-hover:scale-110 shadow-inner overflow-hidden transition-transform">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white tracking-wide">Real Local Voices</h4>
                                        <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">No generic reviews, just people exactly where you are.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-default group">
                                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 rounded-xl text-emerald-400 border border-emerald-400/20 group-hover:scale-110 shadow-inner overflow-hidden transition-transform">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white tracking-wide">Right-Time Decisions</h4>
                                        <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">Find out exactly what a venue is like right this minute.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Form */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative bg-transparent z-10 flex-col flex-1 lg:flex-initial my-auto py-12 lg:py-0">
                        <div className="w-full max-w-[440px] space-y-8 relative z-10">
                            
                            {/* Decorative background shape behind card */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-[#ffb732]/10 to-amber-500/5 blur-[80px] -z-10 rounded-full mix-blend-multiply dark:mix-blend-lighten opacity-70 lg:opacity-100"></div>

                            {/* FORM CONTAINER - The White Card */}
                            <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-3xl border border-white dark:border-slate-800/80 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-none transition-all duration-300 w-full relative group overflow-hidden">
                                
                                {/* Inner Card Glare / Texture */}
                                <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#ffb732]/10 to-transparent opacity-50 pointer-events-none"></div>
                                <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-400/20 blur-[60px] rounded-full pointer-events-none"></div>
                                
                                {/* Top accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-orange-300 via-[#ffb732] to-amber-500/80 shadow-[0_2px_10px_rgba(255,183,50,0.5)]"></div>
                                
                                {/* Header */}
                                <div className="text-center space-y-3 mb-10 relative z-10 pt-4">
                                    <h3 className="text-4xl sm:text-[44px] font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-[-0.04em] leading-tight">
                                        {step === 1 ? "Welcome." : "Finish Sign Up"}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px] sm:text-base max-w-[300px] mx-auto leading-relaxed">
                                        {step === 1 ? "Join your neighborhood. Sign in to see what's happening." : "Pick a username to complete your profile."}
                                    </p>
                                </div>

                                {/* FORM STEPS */}
                                <div className="min-h-[220px] flex flex-col justify-center relative z-10">
                                    {step === 1 ? (
                                        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 w-full space-y-8">
                                            
                                            {/* Google Login Box - Richer Container */}
                                            <div className="w-full bg-slate-50/80 dark:bg-slate-800/50 p-7 sm:p-8 rounded-[28px] border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden group/auth shadow-inner">
                                                
                                                {/* Animated glows inside auth box */}
                                                <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-[#ffb732]/10 rounded-full blur-3xl group-hover/auth:scale-110 transition-transform duration-1000 ease-out"></div>
                                                <div className="absolute bottom-[-50%] left-[-50%] w-full h-full bg-amber-500/10 rounded-full blur-3xl group-hover/auth:scale-110 transition-transform duration-1000 ease-out"></div>

                                                <p className="text-xs sm:text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-6 text-center z-10 uppercase tracking-widest">
                                                    One-tap secure access
                                                </p>
                                            
                                                <div className="w-full flex justify-center hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 z-10">
                                                    <div className="shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] rounded-full overflow-hidden border border-black/5 bg-white">
                                                        <GoogleLogin
                                                            onSuccess={handleGoogleSuccess}
                                                            onError={() => {
                                                                toast.error("Google Login Failed");
                                                            }}
                                                            useOneTap
                                                            theme="outline"
                                                            shape="pill"
                                                            size="large"
                                                            text="continue_with"
                                                            width="280"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Social Proof Elements */}
                                            <div className="mt-4 flex flex-col items-center justify-center gap-3.5">
                                                <div className="flex -space-x-4">
                                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 shadow-md bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0" alt="avatar" className="w-full h-full rounded-full object-cover"/></div>
                                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 shadow-md bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=fef3c7" alt="avatar" className="w-full h-full rounded-full object-cover"/></div>
                                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 shadow-md bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=Sam&backgroundColor=dcfce7" alt="avatar" className="w-full h-full rounded-full object-cover"/></div>
                                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 shadow-md bg-white flex items-center justify-center -space-x-1 pl-1">
                                                        <div className="w-2 h-2 bg-[#ffb732] rounded-full"></div>
                                                        <div className="w-2 h-2 bg-amber-500 rounded-full opacity-60"></div>
                                                        <div className="w-2 h-2 bg-orange-600 rounded-full opacity-30"></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <span className="text-[13px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                                                        Thousands of locals inside
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 w-full bg-slate-50/50 dark:bg-slate-800/30 p-6 sm:p-8 rounded-[28px] border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                                            
                                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ffb732]/10 rounded-full blur-[40px] pointer-events-none"></div>

                                            <div className="space-y-2 relative z-10">
                                                <div className="flex justify-between items-center pl-1 pr-1">
                                                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Unique Username</label>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${username.length > 0 && username.length < 3 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        Min 3 chars
                                                    </span>
                                                </div>
                                                <div className="relative group/input">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold group-focus-within/input:text-[#ffb732] transition-colors">@</span>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-4 text-base font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#ffb732]/30 focus:border-[#ffb732] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-medium shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                                                        placeholder="AppienUser"
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2 relative z-10">
                                                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Current Neighborhood</label>
                                                <div className="relative group/input">
                                                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-[#ffb732] transition-colors pointer-events-none" />
                                                    <select
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-4 text-base font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#ffb732]/30 focus:border-[#ffb732] transition-all shadow-sm appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
                                                    >
                                                        <option value="HSR">HSR Layout</option>
                                                        <option value="Koramangala">Koramangala</option>
                                                        <option value="Both">Both Areas</option>
                                                    </select>
                                                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>

                                            <div className="pt-4 relative z-10">
                                                <button
                                                    onClick={handleCompleteProfile}
                                                    disabled={isLoading || username.length < 3}
                                                    className="w-full bg-gradient-to-br from-[#ffb732] to-amber-500 text-black py-4.5 rounded-2xl font-black text-[15px] uppercase tracking-wide hover:from-[#f9ab21] hover:to-amber-600 hover:shadow-[0_10px_30px_-10px_rgba(255,183,50,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2 active:scale-95 duration-200 shadow-md"
                                                >
                                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Take Me In <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" /></>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Bottom note */}
                                <div className="mt-10 border-t border-slate-100 dark:border-slate-800/60 pt-6 relative z-10 w-full flex justify-center">
                                    <div className="bg-slate-50/80 dark:bg-slate-800/40 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm shadow-sm inline-flex items-center">
                                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Shield size={12} strokeWidth={2.5} className="text-emerald-500" /> Secure • Private • Local
                                        </p>
                                    </div>
                                </div>

                            </div>
                            
                            {/* Privacy note outside card */}
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed font-semibold max-w-[280px] mx-auto opacity-80 backdrop-blur-sm rounded-xl px-2">
                                By continuing, you agree to our <span className="underline cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</span>.
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
        </GoogleOAuthProvider>
    );
}
