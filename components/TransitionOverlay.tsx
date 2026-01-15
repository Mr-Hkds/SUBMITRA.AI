import React from 'react';
import { CheckCircle } from 'lucide-react';

const TransitionOverlay = () => {
    return (
        <div className="fixed inset-0 z-[60] pointer-events-none">
            {/* Fade overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            {/* Particle effects */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-particle-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 0.8}s`,
                            animationDuration: `${1 + Math.random() * 0.5}s`
                        }}
                    />
                ))}
            </div>

            {/* Center success indicator */}
            <div className="absolute inset-0 flex items-center justify-center animate-scale-in">
                <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />

                    {/* Icon container */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)]">
                        <CheckCircle className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-check-pop" />
                    </div>

                    {/* Expanding rings */}
                    <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '1.2s' }} />
                    <div className="absolute inset-[-10px] border border-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
                </div>
            </div>

            {/* Success text */}
            <div className="absolute inset-0 flex items-center justify-center mt-32 animate-slide-up">
                <div className="text-center">
                    <p className="text-emerald-400 font-bold text-lg tracking-wide uppercase mb-1">Script Compiled</p>
                    <p className="text-emerald-500/70 text-xs font-mono">Preparing payload...</p>
                </div>
            </div>
        </div>
    );
};

export default TransitionOverlay;
