import React from 'react';
import { ArrowRight, Sparkles, Zap, Gift, Play } from 'lucide-react';

interface HeroSectionProps {
    url: string;
    setUrl: (url: string) => void;
    onAnalyze: () => void;
    onWatchDemo: () => void;
    loading: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ url, setUrl, onAnalyze, onWatchDemo, loading }) => {
    return (
        <section className="flex-1 flex flex-col items-center justify-center w-full max-w-[100vw] overflow-hidden animate-fade-in-up px-4 sm:px-6 relative z-10 min-h-[60vh] py-8 md:py-12">

            {/* Hero Content */}
            <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-10 mb-8 md:mb-16 w-full px-2">

                {/* Badge: Dynamic Status */}
                {(() => {
                    const [isFirstTime, setIsFirstTime] = React.useState(false);
                    const [mounted, setMounted] = React.useState(false);

                    React.useEffect(() => {
                        const hasVisited = localStorage.getItem('autoform_has_visited');
                        if (!hasVisited) {
                            setIsFirstTime(true);
                            localStorage.setItem('autoform_has_visited', 'true');
                        }
                        setMounted(true);
                    }, []);

                    if (!mounted) return <div className="h-8 mb-4" />; // Prevent hydration mismatch flicker

                    return isFirstTime ? (
                        // FIRST TIME GIFT BADGE
                        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-3xl md:rounded-full bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md animate-fade-in-down mb-4 md:mb-6 mx-auto cursor-default hover:bg-amber-500/20 transition-colors max-w-full">
                            <Gift className="w-3.5 h-3.5 text-amber-500 animate-bounce shrink-0" />
                            <span className="text-[10px] md:text-xs font-mono font-bold text-amber-200 tracking-wide uppercase text-center whitespace-normal leading-tight">
                                First Time Gift: <span className="text-amber-400">30 Free Tokens</span> Included
                            </span>
                        </div>
                    ) : (
                        // RETURNING USER STATUS BADGE
                        <div className="inline-flex flex-wrap items-center justify-center gap-3 px-5 py-2 rounded-3xl md:rounded-full glass-panel border border-white/5 shadow-2xl backdrop-blur-md animate-fade-in-down mb-4 md:mb-6 mx-auto max-w-full">
                            <div className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-[10px] font-mono font-medium text-slate-400 tracking-[0.2em] md:tracking-[0.25em] uppercase text-center whitespace-normal leading-tight">
                                System Status: <span className="text-emerald-500/80">Neural Engine Operational</span>
                            </span>
                        </div>
                    );
                })()}

                {/* Headline */}
                <div className="space-y-4 md:space-y-6 relative px-1 md:px-2">
                    <h1 className="text-2xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight leading-[1.2] md:leading-[1.1] py-2 relative z-10 break-words w-full">
                        <span className="block text-slate-400 opacity-80 text-xs md:text-xl font-sans font-light tracking-[0.15em] md:tracking-[0.3em] uppercase mb-2 md:mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            Precision Engineered
                        </span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-[length:200%_auto] animate-text-shimmer drop-shadow-[0_0_35px_rgba(212,175,55,0.3)] pb-2" style={{ animationDelay: '200ms' }}>
                            Intelligent Automation.
                        </span>
                    </h1>

                    <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto font-mono leading-relaxed tracking-tight animate-fade-in-up px-2 md:px-4" style={{ animationDelay: '300ms' }}>
                        Deploy thousands of authentic, scientifically-weighted responses to any Google Form.
                        <span className="block mt-4 text-slate-500 font-sans font-medium opacity-80 text-[10px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] uppercase flex flex-col md:block gap-1.5 md:gap-1">
                            <span>Statistical Distribution</span>
                            <span className="hidden md:inline text-amber-500 mx-2">•</span>
                            <span>Human-Like Latency</span>
                            <span className="hidden md:inline text-amber-500 mx-2">•</span>
                            <span>Undetectable Execution</span>
                        </span>
                    </p>
                </div>

                {/* Input Area */}
                <div className="max-w-2xl mx-auto w-full relative z-20 animate-scale-in px-0 md:px-2" style={{ animationDelay: '400ms' }}>
                    <div className="relative bg-[#0A0A0A]/80 border border-white/10 rounded-2xl md:rounded-full p-1.5 md:p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] group overflow-hidden w-full">

                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent animate-shimmer-flow pointer-events-none" />

                        {/* Input Wrapper */}
                        <div className="flex items-center w-full md:w-auto flex-1 pl-3 md:pl-4 pr-2 py-3 md:py-0 bg-white/5 md:bg-transparent rounded-xl md:rounded-none border border-white/5 md:border-none">
                            {/* Input Icon */}
                            <div className="text-slate-500 group-focus-within:text-amber-500 transition-colors relative z-10 shrink-0">
                                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                            </div>

                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste Google Form Link..."
                                className="flex-1 bg-transparent border-none text-white text-sm md:text-base placeholder:text-slate-600 focus:outline-none focus:ring-0 px-3 font-sans relative z-10 w-full min-w-0"
                                spellCheck={false}
                            />
                        </div>

                        <button
                            onClick={onAnalyze}
                            disabled={loading || !url}
                            className="w-full md:w-auto relative overflow-hidden px-8 py-3.5 md:py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-[#020617] font-bold rounded-xl md:rounded-full hover:from-amber-400 hover:to-amber-500 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-[1.02] md:hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none z-10 shrink-0"
                        >
                            {/* Button Sheen */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-sheen-sweep pointer-events-none" />

                            {loading ? (
                                <div className="w-5 h-5 border-2 border-[#020617] border-t-transparent rounded-full animate-spin relative z-20" />
                            ) : (
                                <span className="flex items-center gap-2 relative z-20">
                                    Analyze <ArrowRight className="w-4 h-4 text-[#020617]" strokeWidth={3} />
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <button
                            onClick={onWatchDemo}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/10 hover:text-amber-400 hover:border-amber-500/30 transition-all duration-300 group"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Watch Demo</span>
                        </button>
                        <div className="hidden md:block w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest opacity-60">v4.0.1 (Mobile Fix)</span>
                    </div>

                    {/* Premium Status Bar */}
                    <div className="mt-8 relative group cursor-default animate-fade-in-up w-full px-2 md:px-0" style={{ animationDelay: '500ms' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="relative flex flex-col md:flex-row items-center justify-center p-1 rounded-2xl md:rounded-full bg-[#0A0A0A]/40 border border-white/5 backdrop-blur-md shadow-[0_4px_20px_-1px_rgba(0,0,0,0.2)] hover:border-white/10 transition-all duration-500 w-full md:w-auto mx-auto max-w-sm md:max-w-none">

                            {/* Item 1 */}
                            <div className="w-full md:w-auto px-5 py-3 md:py-2 border-b md:border-b-0 md:border-r border-white/5 flex items-center justify-between md:justify-center gap-4 md:gap-3 group/item transition-colors hover:bg-white/[0.02] md:hover:bg-transparent rounded-t-xl md:rounded-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-full bg-white/5 group-hover/item:bg-amber-500/10 transition-colors duration-300">
                                        <Zap className="w-4 h-4 md:w-3.5 md:h-3.5 text-slate-400 group-hover/item:text-amber-400 transition-all duration-300" fill="currentColor" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] text-slate-500 font-sans font-medium uppercase tracking-wider group-hover/item:text-slate-400 transition-colors">Latency</span>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-300 font-medium tracking-wide group-hover/item:text-amber-100 transition-colors">Instant Parse</span>
                            </div>

                            {/* Item 2 */}
                            <div className="w-full md:w-auto px-5 py-3 md:py-2 border-b md:border-b-0 md:border-r border-white/5 flex items-center justify-between md:justify-center gap-4 md:gap-3 group/item transition-colors hover:bg-white/[0.02] md:hover:bg-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-full bg-white/5 group-hover/item:bg-amber-500/10 transition-colors duration-300">
                                        <Sparkles className="w-4 h-4 md:w-3.5 md:h-3.5 text-slate-400 group-hover/item:text-amber-400 transition-all duration-300" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] text-slate-500 font-sans font-medium uppercase tracking-wider group-hover/item:text-slate-400 transition-colors">Engine</span>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-300 font-medium tracking-wide group-hover/item:text-amber-100 transition-colors">Neural AI</span>
                            </div>

                            {/* Item 3 */}
                            <div className="w-full md:w-auto px-5 py-3 md:py-2 flex items-center justify-between md:justify-center gap-4 md:gap-3 group/item transition-colors hover:bg-white/[0.02] md:hover:bg-transparent rounded-b-xl md:rounded-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-full bg-white/5 group-hover/item:bg-amber-500/10 transition-colors duration-300">
                                        <svg className="w-4 h-4 md:w-3.5 md:h-3.5 text-slate-400 group-hover/item:text-amber-400 transition-all duration-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] text-slate-500 font-sans font-medium uppercase tracking-wider group-hover/item:text-slate-400 transition-colors">Protocol</span>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-300 font-medium tracking-wide group-hover/item:text-amber-100 transition-colors">Military Grade</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
