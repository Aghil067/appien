"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, MapPin, Shield, Smartphone, Lock } from 'lucide-react';
import Image from 'next/image';

import API_BASE from '@/lib/api';

export default function LoginPage() {
    const [step, setStep] = useState(1);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [username, setUsername] = useState('');
    const [location, setLocation] = useState('HSR');
    const [isNewUser, setIsNewUser] = useState(true);
    const [existingName, setExistingName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) return alert("Please enter a valid phone number");
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/auth/send-otp`, { phoneNumber });
            setIsNewUser(res.data.isNewUser);
            if (!res.data.isNewUser) {
                setExistingName(res.data.username);
            }
            setStep(2);
        } catch (e) {
            alert("Failed to send OTP. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) return alert("Enter valid 4-digit OTP");
        if (isNewUser && !username) return alert("Please enter a username");
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
                phoneNumber,
                otp,
                username: isNewUser ? username : undefined,
                location: isNewUser ? location : undefined
            });
            localStorage.setItem('token', res.data.token);
            window.dispatchEvent(new Event('user-updated'));
            router.push('/');
        } catch (e) {
            alert("Invalid OTP");
        } finally {
            setIsLoading(false);
        }
    };

    return (
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
            <div className="flex-1 flex flex-col justify-center items-center w-full z-10 px-4 md:px-8 pt-24 pb-8">

                <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl lg:rounded-[32px] rounded-[24px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.08)] dark:shadow-none border border-white/60 dark:border-slate-800 overflow-hidden min-h-[auto] lg:min-h-[680px] relative transition-all duration-500">

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
                        <div className="w-full max-w-md space-y-8">

                            {/* Header Text */}
                            <div className="text-center lg:text-left space-y-2">
                                <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white tracking-tight">
                                    {step === 1 ? "Welcome Back" : (isNewUser ? "Create Profile" : "Verify OTP")}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                                    {step === 1 ? "Enter your mobile number to get started." : <span>We sent a code to <span className="text-slate-900 dark:text-white font-semibold">+91 {phoneNumber}</span></span>}
                                </p>
                            </div>

                            {/* FORM */}
                            <div className="space-y-5">
                                {step === 1 ? (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Mobile Number</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 pr-3 border-r border-slate-200 dark:border-slate-700 h-6">
                                                    <Smartphone size={18} className="text-slate-400 dark:text-slate-500 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors" />
                                                    <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">+91</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    className="w-full bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl pl-[100px] pr-4 py-3.5 text-lg font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal shadow-sm"
                                                    placeholder="98765 00000"
                                                    value={phoneNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val.length <= 10) setPhoneNumber(val);
                                                    }}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">OTP Code</label>
                                            <div className="relative group">
                                                <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl pl-14 pr-4 py-3.5 text-2xl font-bold text-slate-800 dark:text-white tracking-[0.5em] outline-none focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-500/50 transition-all placeholder:tracking-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal placeholder:text-base shadow-sm text-center"
                                                    placeholder="••••"
                                                    maxLength={4}
                                                    value={otp}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val.length <= 4) setOtp(val);
                                                    }}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        {isNewUser && (
                                            <>
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
                                            </>
                                        )}
                                        {!isNewUser && existingName && (
                                            <div className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900/50 p-4 rounded-2xl text-center border border-orange-100 dark:border-orange-900/30 shadow-sm animate-in zoom-in-95 duration-300">
                                                <p className="text-sm text-orange-900 dark:text-orange-300 font-medium">Welcome back,</p>
                                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">@{existingName}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Button */}
                                <div className="space-y-3 pt-2">
                                    <button
                                        onClick={step === 1 ? handleSendOtp : handleVerifyOtp}
                                        disabled={isLoading || (step === 1 && phoneNumber.length < 10) || (step === 2 && otp.length < 4)}
                                        className="w-full bg-gradient-to-r from-[#ffb732] to-amber-500 text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-orange-200/60 dark:shadow-orange-900/40 hover:shadow-orange-300/70 dark:hover:shadow-orange-900/60 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2 active:scale-95 duration-300 group"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (step === 1 ? <>Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></> : "Verify & Login")}
                                    </button>

                                    {step === 2 && (
                                        <button onClick={() => { setStep(1); setOtp(''); }} className="w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 font-semibold transition-colors py-2">
                                            Entered wrong number? <span className="underline decoration-2 underline-offset-2">Change</span>
                                        </button>
                                    )}
                                </div>
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
    );
}