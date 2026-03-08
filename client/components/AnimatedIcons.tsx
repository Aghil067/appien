import React from 'react';

export const AnimatedSmile = ({ isActive }: { isActive: boolean }) => (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-md filter-none' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-110'}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="yellowGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffe082" />
                <stop offset="1" stopColor="#ffb72b" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Face Background */}
        <circle cx="12" cy="12" r="10" className={`transition-all duration-300 ${isActive ? 'fill-[url(#yellowGradient)] stroke-orange-500' : 'fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600 group-hover:fill-[url(#yellowGradient)] group-hover:stroke-orange-400'}`} strokeWidth="1.5" />

        {/* Eyes */}
        <ellipse cx="8.5" cy="9.5" rx="1.5" ry="2" className="fill-slate-500 dark:fill-slate-400 transition-colors duration-300 group-hover:fill-orange-900" />
        <ellipse cx="15.5" cy="9.5" rx="1.5" ry="2" className="fill-slate-500 dark:fill-slate-400 transition-colors duration-300 group-hover:fill-orange-900" />

        {/* Blush */}
        <circle cx="6" cy="13" r="1.5" className={`fill-rose-400/60 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        <circle cx="18" cy="13" r="1.5" className={`fill-rose-400/60 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

        {/* Mouth - Neutral (Default) */}
        <path d="M9 15C10 15.5 12 15.5 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`text-slate-400 dark:text-slate-500 transition-all duration-200 ${isActive ? 'opacity-0 scale-50' : 'group-hover:opacity-0 group-hover:scale-50 opacity-100'}`} style={{ transformOrigin: 'center' }} />

        {/* Mouth - Smile (Active/Hover) */}
        <path d="M7 14.5C8 17.5 10 18.5 12 18.5C14 18.5 16 17.5 17 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" className={`text-orange-900/80 transition-all duration-300 ease-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`} style={{ transformOrigin: 'center' }} />
    </svg>
);

export const AnimatedSad = ({ isActive }: { isActive: boolean }) => (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-md filter-none' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-110'}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="blueGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" />
                <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
        </defs>

        {/* Face Background */}
        <circle cx="12" cy="12" r="10" className={`transition-all duration-300 ${isActive ? 'fill-[url(#blueGradient)] stroke-blue-600' : 'fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600 group-hover:fill-[url(#blueGradient)] group-hover:stroke-blue-400'}`} strokeWidth="1.5" />

        {/* Eyes */}
        <circle cx="8" cy="10" r="1.5" className="fill-slate-500 dark:fill-slate-400 transition-colors duration-300 group-hover:fill-blue-900" />
        <circle cx="16" cy="10" r="1.5" className="fill-slate-500 dark:fill-slate-400 transition-colors duration-300 group-hover:fill-blue-900" />

        {/* Eyebrows */}
        <path d="M6.5 7.5C7.5 7 8.5 7.5 8.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`text-slate-400 dark:text-slate-500 transition-opacity duration-300 ${isActive ? 'text-blue-900 opacity-100' : 'group-hover:text-blue-900 opacity-50'}`} />
        <path d="M17.5 7.5C16.5 7 15.5 7.5 15.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`text-slate-400 dark:text-slate-500 transition-opacity duration-300 ${isActive ? 'text-blue-900 opacity-100' : 'group-hover:text-blue-900 opacity-50'}`} />

        {/* Mouth - Neutral */}
        <path d="M9 15C10 15.5 12 15.5 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`text-slate-400 dark:text-slate-500 transition-all duration-200 ${isActive ? 'opacity-0 scale-50' : 'group-hover:opacity-0 group-hover:scale-50 opacity-100'}`} style={{ transformOrigin: 'center' }} />

        {/* Mouth - Frown */}
        <path d="M16 16C15 14 12 13.5 8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" className={`text-blue-900 transition-all duration-300 ease-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`} style={{ transformOrigin: 'center' }} />
    </svg>
);
