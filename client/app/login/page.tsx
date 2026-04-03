"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, MapPin, Shield } from 'lucide-react';
import Image from 'next/image';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

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

            {/* Background Gradient Mesh */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50/70 to-transparent dark:from-orange-950/25 pointer-events-none z-0"></div>

            {/* --- NAVBAR --- */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 py-4 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="relative h-12 w-36 md:h-14 md:w-40 transition-transform duration-300 hover:scale-105 cursor-pointer">
                    <div className="relative w-full h-full">
                        <Image
                            src="/appien-logo.png"
                            alt="Appien"
                            fill
                            sizes="(max-width: 768px) 144px, 160px"
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
            </header>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col justify-center items-center w-full z-10 px-4 md:px-8 lg:px-12 pt-20 md:pt-24 pb-6 md:pb-8">

                <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl lg:rounded-[32px] rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-none border border-white/60 dark:border-slate-800 overflow-hidden min-h-[auto] lg:min-h-[640px] relative transition-all duration-500">

                    {/* LEFT PANEL: Visuals (Desktop Only) */}
                    <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 relative flex-col justify-between p-12 text-white overflow-hidden">
                        {/* Internal Glows */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffb732]/25 rounded-full blur-[140px] -mr-20 -mt-20 mix-blend-screen"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/25 rounded-full blur-[120px] -ml-20 -mb-20 mix-blend-screen"></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 pl-2 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-orange-100 mb-8 backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                </span>
                                <span>Live in Your City</span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
                                Decide where<br />
                                to hang out, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-300">locally.</span>
                            </h2>
                            <p className="text-orange-100/80 text-base leading-relaxed max-w-md font-medium mb-6">
                                Ask people around you what places are calm, crowded, family-friendly, or worth visiting <em>right now</em> - before you step out.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-3">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-white">Local Voices Only</h4>
                                    <p className="text-xs text-orange-200/70 mt-0.5 font-medium">People nearby answer based on real experience.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-white">Right-Time Decisions</h4>
                                    <p className="text-xs text-orange-200/70 mt-0.5 font-medium">Know what's calm, crowded, or worth visiting <em>now</em>.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform"><MapPin size={22} strokeWidth={2} /></div>
                                <div>
                                    <h4 className="font-semibold text-sm text-white">Small Areas, Real Opinions</h4>
                                    <p className="text-xs text-orange-200/70 mt-0.5 font-medium">Answers stay local - not city-wide noise.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Form */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 relative bg-transparent">
                        <div className="w-full max-w-md space-y-6 md:space-y-8 relative z-10">
                            {/* Header Text */}
                            <div className="text-center lg:text-left space-y-3">
                                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {step === 1 ? "Get Started" : "Create Profile"}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base max-w-[280px] lg:max-w-none mx-auto lg:mx-0">
                                    {step === 1 ? "Join your local neighborhood and see where everyone's hanging out." : "Finish setting up your account."}
                                </p>
                            </div>

                            {/* FORM */}
                            <div className="space-y-6 md:space-y-8">
                                {step === 1 ? (
                                    <div className="flex flex-col items-center sm:items-stretch lg:items-start pt-2 md:pt-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                        
                                        <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center space-y-6 shadow-sm relative overflow-hidden">
                                            
                                            {/* Subtle Color Accent Top Bar */}
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-500"></div>

                                            <div className="w-full flex justify-center pt-2">
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={() => {
                                                        console.log('Login Failed');
                                                        alert("Google Login Failed");
                                                    }}
                                                    useOneTap
                                                    theme="outline"
                                                    shape="rectangular"
                                                    size="large"
                                                    text="continue_with"
                                                    width="300"
                                                />
                                            </div>

                                            <div className="w-full flex items-center gap-3 opacity-90 pt-2">
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                                <p className="text-[10px] text-orange-500 dark:text-orange-400 font-bold uppercase tracking-widest">Secure Login</p>
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                            </div>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                                                By continuing, you agree to our <span className="underline cursor-pointer hover:text-orange-500 transition-colors">Terms</span> & <span className="underline cursor-pointer hover:text-orange-500 transition-colors">Privacy Policy</span>.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-500 space-y-2">
                                            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Choose Username</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-lg group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors">@</span>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-lg font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal shadow-sm"
                                                    placeholder="username"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                                />
                                            </div>
                                        </div>
                                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100 space-y-2">
                                            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Your Location</label>
                                            <div className="relative group">
                                                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors pointer-events-none" />
                                                <select
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    className="w-full bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl pl-14 pr-4 py-3.5 text-lg font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-500/50 transition-all shadow-sm appearance-none cursor-pointer"
                                                >
                                                    <option value="HSR">HSR Layout</option>
                                                    <option value="Koramangala">Koramangala</option>
                                                    <option value="Both">Both Areas</option>
                                                </select>
                                                <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-600 ml-1 font-medium">Select 'Both' to receive notifications from all areas</p>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <button
                                                onClick={handleCompleteProfile}
                                                disabled={isLoading || username.length < 3}
                                                className="w-full bg-gradient-to-r from-[#ffb732] to-amber-500 text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-orange-200/60 dark:shadow-orange-900/40 hover:shadow-orange-300/70 dark:hover:shadow-orange-900/60 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2 active:scale-95 duration-300 group"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Complete Profile <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Note */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 font-semibold uppercase tracking-widest flex items-center justify-center gap-2 opacity-60">
                        <Shield size={10} /> Secure • Private • Local
                    </p>
                </div>

            </div>
        </div>
        </GoogleOAuthProvider>
    );
}