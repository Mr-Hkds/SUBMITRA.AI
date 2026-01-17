import React from 'react';
import { Sparkles, Zap, Activity, Loader2, Target, Cpu, ShieldCheck } from 'lucide-react';

interface LoadingScreenProps {
    progress: string;
    percentage?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, percentage }) => {
    const tips = [
        { icon: <Activity className="w-4 h-4" />, text: "PROCESSED: DATA_NORMALIZATION_SEQUENCE" },
        { icon: <Target className="w-4 h-4" />, text: "ACTIVE: BELL_CURVE_CALIBRATION" },
        { icon: <Cpu className="w-4 h-4" />, text: "EXECUTING: DEMOGRAPHIC_CROSS_FILTERING" },
        { icon: <Zap className="w-4 h-4" />, text: "OPTIMIZING: WEIGHT_DISTRIBUTION_ARRAYS" }
    ];

    const [currentTip, setCurrentTip] = React.useState(0);
    const [scanlineOffset, setScanlineOffset] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTip(prev => (prev + 1) % tips.length);
        }, 4000);

        const scanline = setInterval(() => {
            setScanlineOffset(prev => (prev + 1) % 100);
        }, 50);

        return () => {
            clearInterval(interval);
            clearInterval(scanline);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000000] font-mono select-none overflow-hidden">
            {/* Minimal Background Elements */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ transform: `translateY(${scanlineOffset}vh)` }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000_80%)]" />
            </div>

            <div className="relative w-full max-w-lg px-6 flex flex-col items-center">
                {/* Advanced Tech Logo - Orbital Ring System */}
                <div className="relative mb-16 group h-32 w-32">
                    {/* Background Tech Glow */}
                    <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-1000" />

                    {/* Rotating Rings */}
                    <div className="absolute inset-0 border-[1px] border-amber-500/10 rounded-full animate-spin-slow" />
                    <div className="absolute inset-2 border-[1px] border-amber-500/20 rounded-full animate-spin-reverse opacity-50" />
                    <div className="absolute inset-4 border-t-[2px] border-amber-500/40 rounded-full animate-spin-slow" />

                    {/* Hex-Grid Mask Center */}
                    <div className="absolute inset-8 rounded-xl bg-[#0a0a0a] border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)] flex items-center justify-center overflow-hidden">
                        {/* Hex Grid Background */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #f59e0b 1px, transparent 0)', backgroundSize: '8px 8px' }} />

                        <div className="relative z-10 flex flex-col items-center">
                            <Zap className="w-8 h-8 text-amber-500 animate-pulse" />
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl animate-pulse" />
                        </div>

                        {/* Scanning Bar Inner */}
                        <div className="absolute inset-x-0 h-[100%] w-[1px] bg-amber-500/20 left-1/2 -translate-x-1/2 animate-shimmer-slow" />
                    </div>

                    {/* Corner Brackets */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/40 rounded-tl" />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/40 rounded-br" />
                </div>

                {/* Minimal Status Label */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <h2 className="text-[10px] font-bold text-amber-500 tracking-[0.5em] uppercase mb-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                        Deep-Layer Initialization
                    </h2>
                    <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    <span className="mt-2 text-[7px] text-slate-600 tracking-[0.4em] uppercase font-mono">
                        Protocol: MISSION_CONTROL_v0.1.2
                    </span>
                </div>

                {/* Status Command Line */}
                <div className="w-full bg-slate-900/5 border border-white/5 rounded-lg p-6 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-sm bg-amber-500/80 animate-pulse rotate-45" />
                            <span className="uppercase tracking-[0.2em] font-bold text-slate-300">
                                {progress || 'Loading Neural Bridge...'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className={`w-1 h-3 rounded-full ${percentage && percentage > 20 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                                <div className={`w-1 h-3 rounded-full ${percentage && percentage > 50 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                                <div className={`w-1 h-3 rounded-full ${percentage && percentage > 80 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                            </div>
                            <span className="text-amber-500 font-mono font-bold text-sm tracking-tighter w-10 text-right">
                                {percentage || 0}%
                            </span>
                        </div>
                    </div>

                    {/* Minimal Progress Bar */}
                    <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-700 ease-in-out"
                            style={{ width: `${percentage || 0}%` }}
                        />
                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer w-[200%]" />
                    </div>

                    {/* Consolidated Tip Terminal */}
                    <div className="flex items-center gap-3 text-[9px] border-t border-white/5 pt-5">
                        <div className="text-amber-500/30 flex flex-col font-mono">
                            <span className="leading-none text-xs">»</span>
                        </div>
                        <div className="flex-1 text-slate-500 font-medium flex items-center gap-2">
                            <span className="inline-block animate-fade-slide-in font-mono tracking-tight uppercase">
                                {tips[currentTip].text}
                            </span>
                            <span className="w-1.5 h-3 bg-amber-500/50 animate-[blink_1s_infinite] ml-1" />
                        </div>
                        <Loader2 className="w-3.5 h-3.5 text-amber-500/20 animate-spin" />
                    </div>
                </div>

                {/* Minimal Footer Footer */}
                <div className="mt-8 flex items-center justify-center gap-8 opacity-30">
                    <div className="flex items-center gap-2 text-[7px] tracking-[0.4em] text-slate-500">
                        <Activity className="w-2.5 h-2.5" />
                        <span>SENTRY_LINK_STABLE</span>
                    </div>
                    <div className="flex items-center gap-2 text-[7px] tracking-[0.4em] text-slate-500">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>AES_256_ENCRYPTED</span>
                    </div>
                </div>
            </div>

            {/* Consolidated Animations */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(30px, -30px) scale(1.1); }
                }
                @keyframes float-slower {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-40px, 40px) scale(1.15); }
                }
                @keyframes float-particle {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.05); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes shimmer-slow {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                @keyframes progress-flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes fade-slide-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes pulse-border {
                    0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.1); }
                    50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.2); }
                }

                .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
                .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
                .animate-float-particle { animation: float-particle 8s linear infinite; }
                .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
                .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                .animate-spin-reverse { animation: spin-reverse 6s linear infinite; }
                .animate-shimmer { animation: shimmer 2s linear infinite; }
                .animate-shimmer-slow { animation: shimmer-slow 4s linear infinite; }
                .animate-progress-flow { 
                    animation: progress-flow 3s ease infinite;
                    background-size: 200% 200%;
                }
                .animate-fade-slide-in { animation: fade-slide-in 0.6s ease-out; }
                .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
                .animate-pulse-border { animation: pulse-border 2s ease-in-out infinite; }
                .border-3 { border-width: 3px; }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
