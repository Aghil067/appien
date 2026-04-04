import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export const AnimatedSmile = ({ isActive }: { isActive: boolean }) => (
    <div className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-sm text-amber-500' : 'text-slate-400 opacity-60 hover:text-amber-500 hover:opacity-100 hover:scale-110'}`}>
        <ThumbsUp size={16} className={isActive ? 'fill-amber-500' : ''} />
    </div>
);

export const AnimatedSad = ({ isActive }: { isActive: boolean }) => (
    <div className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-sm text-slate-500' : 'text-slate-400 opacity-60 hover:text-slate-600 hover:opacity-100 hover:scale-110'}`}>
        <ThumbsDown size={16} className={isActive ? 'fill-slate-500' : ''} />
    </div>
);

