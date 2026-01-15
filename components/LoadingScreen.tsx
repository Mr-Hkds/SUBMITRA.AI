import React from 'react';
import { Sparkles, Zap, Activity, CheckCircle, Loader2, TrendingUp } from 'lucide-react';

interface LoadingScreenProps {
    progress: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
    const tips = [
        { icon: "📊", text: "Applying Bell Curve distributions for realistic demographics" },
        { icon: "🎯", text: "Ensuring logical consistency across Age, Income & Occupation" },
        { icon: "🔬", text: "Cross-referencing patterns from 100+ demographic surveys" },
        { icon: "⚡", text: "Optimizing weight distributions for maximum accuracy" },
        { icon: "🧠", text: "Statistical algorithms working in perfect harmony" },
        { icon: "✨", text: "Crafting premium-grade demographic intelligence" }
    ];

    const [currentTip, setCurrentTip] = React.useState(0);
    const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

    React.useEffect(() => {
        // Generate floating particles
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 5
        }));
        setParticles(newParticles);

        // Rotate tips
        const interval = setInterval(() => {
            setCurrentTip(prev => (prev + 1) % tips.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
            {/* Animated Background Gradient Orbs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float-slower" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow" />
            </div>

            {/* Floating Particles */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float-particle"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        animationDelay: `${particle.delay}s`
                    }}
                />
            ))}

            {/* Main Content */}
            <div className="relative max-w-3xl w-full px-8">
                {/* Premium Header with Glassmorphism */}
                <div className="text-center mb-10">
                    {/* Icon Container with Multiple Rings */}
                    <div className="relative inline-flex items-center justify-center mb-8">
                        {/* Outer rotating ring */}
                        <div className="absolute w-32 h-32 rounded-full border border-purple-500/20 animate-spin-slow" />
                        <div className="absolute w-28 h-28 rounded-full border-2 border-cyan-500/30 animate-spin-reverse" />

                        {/* Center orb */}
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-amber-500/20 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-500/40 animate-pulse-glow" />
                            <Sparkles className="relative w-12 h-12 text-amber-300 animate-pulse-slow" />
                        </div>
                    </div>

                    {/* Title with Gradient */}
                    <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-200 via-cyan-200 to-amber-200 bg-clip-text text-transparent tracking-tight">
                        Statistical Analysis Engine
                    </h2>
                    <p className="text-slate-400 text-lg font-light tracking-wide">
                        Crafting Premium Demographic Intelligence
                    </p>
                </div>

                {/* Glassmorphic Progress Container */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mb-6 shadow-2xl">
                    {/* Progress Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                            <span className="text-sm font-semibold text-slate-200 tracking-wide">
                                {progress || 'Initializing Systems...'}
                            </span>
                        </div>
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    </div>

                    {/* Premium Progress Bar */}
                    <div className="relative h-3 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-amber-500/20 animate-shimmer" />
                        <div className="relative h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-amber-500 rounded-full animate-progress-flow shadow-lg shadow-purple-500/50"
                            style={{ width: '100%' }} />
                    </div>
                </div>

                {/* Animated Insight Card */}
                <div className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-amber-500/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6 shadow-xl overflow-hidden relative">
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-slow" />

                    <div className="relative flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/20">
                            <span className="text-2xl animate-bounce-subtle">{tips[currentTip].icon}</span>
                        </div>
                        <div className="flex-1 pt-1">
                            <p className="text-white text-base font-medium leading-relaxed animate-fade-slide-in">
                                {tips[currentTip].text}
                            </p>
                        </div>
                        <Zap className="flex-shrink-0 w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                </div>

                {/* Status Grid with Glassmorphism */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Completed Stage */}
                    <div className="group bg-emerald-500/10 backdrop-blur-xl rounded-xl p-5 text-center border border-emerald-500/20 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105">
                        <div className="relative inline-flex items-center justify-center mb-3">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-lg animate-pulse" />
                        </div>
                        <p className="text-xs font-semibold text-emerald-300 tracking-wide">FORM PARSED</p>
                        <div className="mt-2 h-1 bg-emerald-500/30 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-full" />
                        </div>
                    </div>

                    {/* Active Stage */}
                    <div className="group bg-cyan-500/10 backdrop-blur-xl rounded-xl p-5 text-center border border-cyan-500/30 shadow-lg shadow-cyan-500/20 animate-pulse-border">
                        <div className="relative inline-flex items-center justify-center mb-3">
                            <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-lg animate-pulse" />
                        </div>
                        <p className="text-xs font-semibold text-cyan-300 tracking-wide">DEEP ANALYSIS</p>
                        <div className="mt-2 h-1 bg-cyan-500/30 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 w-2/3 animate-progress-flow" />
                        </div>
                    </div>

                    {/* Pending Stage */}
                    <div className="group bg-slate-500/5 backdrop-blur-xl rounded-xl p-5 text-center border border-slate-500/10 shadow-lg opacity-60 hover:opacity-80 transition-all duration-300">
                        <div className="relative inline-flex items-center justify-center mb-3">
                            <TrendingUp className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-xs font-semibold text-slate-400 tracking-wide">FINAL REVIEW</p>
                        <div className="mt-2 h-1 bg-slate-500/20 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-500/50 w-0" />
                        </div>
                    </div>
                </div>

                {/* Premium Footer */}
                <div className="text-center">
                    <p className="text-slate-500 text-xs font-light tracking-widest uppercase">
                        Estimated Time: 30-90 seconds for optimal results
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
            </div>

            {/* Premium Animations */}
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
                    0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.2); }
                    50% { box-shadow: 0 0 40px rgba(34, 211, 238, 0.4); }
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
