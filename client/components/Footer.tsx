"use client";
import { Heart, MapPin, Sparkles } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">

            {/* Animated Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>

            <div className="max-w-6xl mx-auto px-6 py-8 md:py-10 relative z-10">

                {/* Main Content - Centered */}
                <div className="flex flex-col items-center text-center space-y-5">

                    {/* Logo */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="relative h-14 w-44 md:h-16 md:w-48">
                            <div
                                className="w-full h-full bg-gradient-to-r from-[#ffb732] to-amber-400"
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

                    {/* Tagline */}
                    <div className="max-w-2xl space-y-3">
                        <p className="text-base md:text-lg text-slate-300 leading-relaxed font-medium">
                            Helping people decide where to hang out by asking locals what's actually happening nearby.
                        </p>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                                <MapPin size={12} className="text-orange-400" />
                                <span className="text-xs font-medium text-slate-400">Hyper-Local</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                                <Sparkles size={12} className="text-amber-400" />
                                <span className="text-xs font-medium text-slate-400">Real-Time</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-xs font-medium text-slate-400">Community-Driven</span>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Divider */}
                    <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

                    {/* Bottom Info */}
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-xs text-slate-500">
                        <p className="font-medium">
                            &copy; {currentYear} <span className="text-slate-400">Appien Inc.</span> All rights reserved.
                        </p>

                        <div className="hidden md:block w-1 h-1 rounded-full bg-slate-700"></div>

                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-slate-700/50 backdrop-blur-sm shadow-lg">
                            <span className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">Made with</span>
                            <Heart size={11} className="text-red-500 fill-red-500 animate-pulse" />
                            <span className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">in Bangalore</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
        </footer>
    );
}