import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export const AnimatedSmile = ({ isActive }: { isActive: boolean }) => (
    <div className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-md text-emerald-500' : 'text-slate-400 opacity-60 hover:text-emerald-400 hover:opacity-100 hover:scale-110'}`}>
        <ThumbsUp size={20} className={isActive ? 'fill-emerald-500' : ''} />
    </div>
);

export const AnimatedSad = ({ isActive }: { isActive: boolean }) => (
    <div className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-md text-red-500' : 'text-slate-400 opacity-60 hover:text-red-400 hover:opacity-100 hover:scale-110'}`}>
        <ThumbsDown size={20} className={isActive ? 'fill-red-500' : ''} />
    </div>
);

