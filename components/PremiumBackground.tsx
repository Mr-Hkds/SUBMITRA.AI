import React from 'react';

const PremiumBackground = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#000000]">
            {/* 1. Deep Grain Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay" />

            {/* 2. Cinematic Vignette (Radial Gradient) */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-80" />

            {/* 3. Orbital Ambient Glows - Slow Moving */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[120px] animate-blob mix-blend-screen" />
            <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-emerald-900/10 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen" />
            <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-indigo-900/10 rounded-full blur-[140px] animate-blob animation-delay-4000 mix-blend-screen" />

            {/* 4. Perspective Grid Floor */}
            <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px),
                                      linear-gradient(to bottom, #334155 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                    maskImage: 'linear-gradient(to bottom, transparent, 20%, white, 80%, transparent)'
                }}
            />
        </div>
    );
};

export default PremiumBackground;
