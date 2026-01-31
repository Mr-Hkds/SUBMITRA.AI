import React, { useEffect, useRef, useState } from 'react';
import { Activity, Terminal, Shield, Zap, CheckCircle, Clock, Disc, Cpu, AlertCircle, Settings, Crown } from 'lucide-react';

interface MissionLog {
    msg: string;
    status: string;
    count: number;
    timestamp: number;
}

interface MissionControlProps {
    logs: MissionLog[];
    targetCount: number;
    initialTokens: number;
    onAbort: () => void;
    onBackToConfig: () => void;
    onNewMission: () => void;
    formTitle: string;
    onShowPricing?: () => void;
    onTokenUpdate?: (val: number) => void;
}

const MissionControl: React.FC<MissionControlProps> = ({ logs, targetCount, initialTokens, onAbort, onBackToConfig, onNewMission, formTitle, onShowPricing, onTokenUpdate }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [tokenPhase, setTokenPhase] = useState<'IDLE' | 'REDUCING' | 'DONE'>('IDLE');
    const [displayedTokens, setDisplayedTokens] = useState(initialTokens);
    const [isTicking, setIsTicking] = useState(false);
    const startTokensRef = useRef(initialTokens);
    const containerRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    const currentCount = logs.length > 0 ? logs[logs.length - 1].count : 0;
    const currentStatus = logs.length > 0 ? logs[logs.length - 1].status : 'INITIALIZING';
    const progress = (currentCount / targetCount) * 100;

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Timer
    useEffect(() => {
        if (currentStatus === 'DONE' || currentStatus === 'ERROR' || currentStatus === 'ABORTED') return;

        const start = Date.now() - (elapsedTime * 1000); // Resume from previous if needed
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [currentStatus]);

    // Auto-scroll logs without jumping the whole page (direct container manipulation)
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // Center viewport on completion start/abort
    useEffect(() => {
        if (tokenPhase === 'REDUCING' || currentStatus === 'ABORTED') {
            setTimeout(() => {
                const element = containerRef.current;
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const finalTop = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
                    window.scrollTo({ top: finalTop, behavior: 'smooth' });
                }
            }, 100);
        }
    }, [tokenPhase, currentStatus]);

    // 1. Trigger Reduction Phase
    useEffect(() => {
        if (currentStatus === 'DONE' && tokenPhase === 'IDLE') {
            setTokenPhase('REDUCING');
        }
    }, [currentStatus, tokenPhase]);

    // 2. Execute Animation Loop (Run ONLY when phase becomes REDUCING)
    useEffect(() => {
        if (tokenPhase === 'REDUCING') {
            const startDelay = setTimeout(() => {
                const startValue = startTokensRef.current;
                const endValue = startValue - targetCount;
                const duration = 2500;
                const startTime = Date.now();

                let lastValue = startValue;

                const animateTools = () => {
                    const now = Date.now();
                    const timeProgress = Math.min((now - startTime) / duration, 1);

                    // Ease out expo
                    const easeOut = timeProgress === 1 ? 1 : 1 - Math.pow(2, -10 * timeProgress);
                    const current = Math.floor(startValue - (targetCount * easeOut));

                    if (current !== lastValue) {
                        setDisplayedTokens(current);
                        if (onTokenUpdate) onTokenUpdate(current);
                        setIsTicking(true);
                        setTimeout(() => setIsTicking(false), 50);
                        lastValue = current;
                    }

                    if (timeProgress < 1) {
                        requestAnimationFrame(animateTools);
                    } else {
                        setDisplayedTokens(endValue);
                        setTimeout(() => setTokenPhase('DONE'), 1000);
                    }
                };
                requestAnimationFrame(animateTools);
            }, 1500);

            return () => clearTimeout(startDelay);
        }
    }, [tokenPhase, targetCount]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            ref={containerRef}
            className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in-up relative scroll-mt-20"
        >
            {/* TOKEN REDUCTION OVERLAY */}
            {tokenPhase === 'REDUCING' && (
                <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-[#020617]/95 backdrop-blur-2xl animate-fade-in border border-amber-500/10 rounded-2xl">
                    <div className="text-center space-y-8 max-w-md px-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative bg-black border border-amber-500/20 p-8 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                    <Crown className="w-12 h-12 text-amber-500 animate-bounce" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-amber-500/60 font-mono text-[10px] uppercase tracking-[0.4em] mb-4">Neural Resource Deduction</p>
                            <div className="flex flex-col items-center">
                                <span className={`text-7xl font-mono font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-transform duration-75 ${isTicking ? 'scale-110 text-amber-400' : 'scale-100'}`}>
                                    {displayedTokens}
                                </span>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-[2px] w-8 bg-red-500/50 rounded-full" />
                                    <span className="text-red-500 font-mono font-bold text-sm">-{targetCount} Units</span>
                                    <div className="h-[2px] w-8 bg-red-500/50 rounded-full" />
                                </div>
                            </div>
                        </div>

                        <p className="text-slate-400 text-xs font-mono animate-pulse">
                            Finalizing secure handshake & anchoring data...
                        </p>
                    </div>
                </div>
            )}

            {/* SUCCESS OVERLAY */}
            {tokenPhase === 'DONE' && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]/90 backdrop-blur-xl animate-fade-in border border-emerald-500/20 rounded-2xl shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
                        <div className="relative bg-emerald-500/20 p-6 rounded-full border border-emerald-500/30">
                            <CheckCircle className="w-16 h-16 text-emerald-500" />
                        </div>
                    </div>

                    <h2 className="text-4xl font-serif font-bold text-white mb-4 tracking-tight text-center px-4">Task Completed Successfully</h2>
                    <div className="flex flex-col items-center gap-2 mb-10 text-center px-12">
                        <p className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] font-bold">
                            Total Duration: {logs.length > 1 ? Math.floor((logs[logs.length - 1].timestamp - logs[0].timestamp) / 1000) : elapsedTime} Seconds
                        </p>
                        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                            The automation process has successfully submitted all {targetCount} form entries. The operation is now finished and all records have been anchored.
                        </p>
                        <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                            <Crown className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-mono text-emerald-200">Final Balance: {startTokensRef.current - targetCount} Units</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onNewMission}
                            className="group relative px-8 py-4 bg-emerald-600 text-white font-bold uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
                        >
                            Initialize New Sequence
                        </button>
                        <button
                            onClick={onBackToConfig}
                            className="px-8 py-4 bg-white/5 border border-white/10 text-slate-300 font-bold uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-white/10 transition-all active:scale-95"
                        >
                            Return to Config
                        </button>
                    </div>
                </div>
            )}

            {/* ABORTED OVERLAY */}
            {currentStatus === 'ABORTED' && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#000000]/95 backdrop-blur-3xl animate-fade-in border border-red-500/20 rounded-2xl shadow-[0_0_100px_rgba(239,68,68,0.1)]">
                    <h2 className="text-4xl font-serif font-bold text-white mb-4 tracking-tight text-center text-red-100">Mission Aborted</h2>
                    <div className="flex flex-col items-center gap-2 mb-10 text-center px-12">
                        <p className="text-red-400 font-mono text-xs uppercase tracking-[0.3em] font-bold">
                            Safety Intercept Triggered
                        </p>
                        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                            The operation was manually terminated. Only {currentCount} of {targetCount} payloads were deployed. No further data will be transmitted.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onBackToConfig}
                            className="group relative px-8 py-4 bg-amber-600 text-white font-bold uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-amber-500 transition-all shadow-lg active:scale-95"
                        >
                            Adjust Configuration
                        </button>
                        <button
                            onClick={onNewMission}
                            className="px-8 py-4 bg-white/5 border border-white/10 text-slate-300 font-bold uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-white/10 transition-all active:scale-95"
                        >
                            New Mission
                        </button>
                    </div>
                </div>
            )}

            {/* Header Cockpit */}
            <div className={`flex flex-col md:flex-row items-center justify-between gap-6 glass-panel p-8 rounded-2xl relative overflow-hidden border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)] ${currentStatus === 'ABORTED' ? 'border-red-500/30 opacity-50 grayscale-[0.5]' : ''}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        {/* Progress Circle Visual */}
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48" cy="48" r="40"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-white/5"
                            />
                            <circle
                                cx="48" cy="48" r="40"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                                className={`${currentStatus === 'DONE' ? 'text-emerald-500' : currentStatus === 'ABORTED' ? 'text-red-500' : 'text-amber-500'} transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-mono font-bold text-white">{Math.round(progress)}%</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full animate-pulse 
                                ${currentStatus === 'DONE' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' :
                                    currentStatus === 'ABORTED' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' :
                                        'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}
                            />
                            <span className={`text-[10px] font-mono uppercase tracking-[0.2em] font-bold 
                                ${tokenPhase !== 'IDLE' ? 'text-emerald-500' :
                                    currentStatus === 'ABORTED' ? 'text-red-500' :
                                        'text-amber-500'}`}>
                                {tokenPhase !== 'IDLE' ? 'Mission Complete' :
                                    currentStatus === 'ABORTED' ? 'Mission Interrupted' :
                                        'Mission Active'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-white tracking-tight">{formTitle}</h2>
                        <SystemTelemetry />
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="text-right hidden sm:block">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Duration</span>
                        <span className="text-xl font-mono text-white">{formatTime(elapsedTime)}</span>
                    </div>
                    {currentStatus === 'DONE' ? (
                        <button
                            onClick={onNewMission}
                            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Initialize New Job
                        </button>
                    ) : currentStatus === 'ABORTED' ? (
                        <button
                            onClick={onBackToConfig}
                            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all duration-300"
                        >
                            <Settings className="w-4 h-4" />
                            Back to Config
                        </button>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            {currentStatus === 'ERROR' ? (
                                <button
                                    disabled
                                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest cursor-not-allowed opacity-80"
                                >
                                    <div className="w-3 h-3 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
                                    Stopping...
                                </button>
                            ) : (
                                <button
                                    onClick={onAbort}
                                    className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-red-600 border border-red-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 shadow-lg shadow-red-900/50 active:scale-95 transform"
                                >
                                    <AlertCircle className="w-4 h-4 fill-white/10" />
                                    Abort Mission
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ACTIVE MONITORING DISCLAIMER - Simplified */}
            {currentStatus !== 'DONE' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Active Monitoring Required</h4>
                        <p className="text-amber-200/60 text-[10px] leading-relaxed font-mono">
                            Keep this tab <span className="text-amber-400 font-bold underline">ACTIVE</span> and your device <span className="text-amber-400 font-bold underline">UNLOCKED</span>.
                            Switching tabs or minimizing the browser will pause the automation process.
                        </p>
                    </div>
                </div>
            )}


            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumStatCard
                    variant="progress"
                    label="MISSION STATUS"
                    value={currentCount}
                    total={targetCount}
                    sub="Anchored Blocks"
                    color="emerald"
                />
                <PremiumStatCard
                    variant="velocity"
                    label="NEURAL VELOCITY"
                    value={elapsedTime > 0 ? (currentCount / (elapsedTime / 60)).toFixed(1) : "0.0"}
                    sub="Ops / Minute"
                    color="amber"
                />
                <PremiumStatCard
                    variant="timer"
                    label="ESTIMATED ARRIVAL"
                    value={currentCount > 0 && elapsedTime > 0
                        ? (() => {
                            const rate = currentCount / elapsedTime;
                            const remaining = targetCount - currentCount;
                            const estSeconds = remaining / rate;
                            return estSeconds > 0 && isFinite(estSeconds) ? estSeconds : 0;
                        })()
                        : null}
                    sub="T-Minus Countdown"
                    color="blue"
                />
            </div>

            {/* Terminal View */}
            <div className="glass-panel rounded-2xl overflow-hidden border-white/5 shadow-2xl">
                <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Neural Link Stream</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500/20" />
                        <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                    </div>
                </div>
                <div
                    ref={logContainerRef}
                    className="bg-[#020617]/80 backdrop-blur-3xl p-6 h-[400px] overflow-y-auto font-mono text-xs space-y-2 selection:bg-amber-500/30 custom-scrollbar relative"
                >
                    {logs.length === 0 && (
                        <div className="text-slate-600 animate-pulse">Waiting for initial handshake...</div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-4 animate-fade-in group">
                            <span className="text-slate-700 shrink-0 text-[10px] pt-0.5">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className={`
                ${log.status === 'DONE' ? 'text-emerald-400' : ''}
                ${log.status === 'ERROR' ? 'text-red-400 font-bold' : ''}
                ${log.status === 'COOLDOWN' ? 'text-purple-400 italic' : ''}
                ${log.status === 'RUNNING' || log.status === 'INIT' ? 'text-amber-200/80' : ''}
                group-hover:text-white transition-colors leading-relaxed
              `}>
                                {log.msg}
                            </span>
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>

            <style>{`
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.3); }

        @keyframes alert-blink {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.4)); transform: scale(1); }
            50% { opacity: 0.8; filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.8)); transform: scale(1.02); }
        }
        .animate-alert-blink {
            animation: alert-blink 1.5s infinite ease-in-out;
        }

        @keyframes count-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-count-pulse {
            animation: count-pulse 0.5s ease-out;
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    );
};

const PremiumStatCard = ({ variant, label, value, total, sub, color }: any) => {
    // Check if "loading" or zero state
    const isZero = !value || value === "0" || value === "0.0" || value === 0;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] border border-white/5 shadow-2xl group transition-all duration-500 hover:shadow-emerald-500/10 hover:border-white/10">
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none mix-blend-overlay" />

            {/* Subtle Gradient Glow */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${color}-500/10 blur-[60px] rounded-full group-hover:bg-${color}-500/20 transition-all duration-700`} />

            <div className="relative z-10 p-6 flex flex-col h-full bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="flex justify-between items-start mb-6">
                    <span className="text-[9px] font-mono tracking-[0.2em] text-slate-500 font-bold uppercase">{label}</span>
                    <div className={`flex items-center gap-2`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isZero ? 'bg-slate-700' : `bg-${color}-500 animate-pulse shadow-[0_0_8px_currentColor]`}`} />
                        {isZero && <span className="text-[9px] text-slate-600 animate-pulse">INIT</span>}
                    </div>
                </div>

                <div className="flex-1 flex items-center gap-5">
                    {/* Visualizations */}
                    {variant === 'progress' && (
                        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
                                <circle
                                    cx="28" cy="28" r="24"
                                    stroke="currentColor" strokeWidth="3" fill="transparent"
                                    strokeDasharray={150.8}
                                    strokeDashoffset={150.8 - (150.8 * (Math.min(Number(value) / (Number(total) || 1), 1)))}
                                    className={`text-${color}-500 transition-all duration-1000 ease-out`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Activity className={`w-4 h-4 text-${color}-500/50`} />
                            </div>
                        </div>
                    )}

                    {variant === 'velocity' && (
                        <div className="flex items-end gap-[3px] h-10 shrink-0 pb-1 px-1">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className={`w-1.5 bg-gradient-to-t from-${color}-500 to-${color}-400/50 rounded-sm animate-[count-pulse_0.8s_ease-in-out_infinite]`} style={{ height: isZero ? '4px' : `${20 + (Math.random() * 80)}%`, animationDelay: `${i * 0.15}s`, opacity: 0.8 }} />
                            ))}
                        </div>
                    )}

                    {variant === 'timer' && (
                        <div className={`p-3 rounded-xl bg-${color}-500/5 border border-${color}-500/10 shrink-0 relative overflow-hidden`}>
                            <div className={`absolute inset-0 bg-${color}-500/10 blur-xl`} />
                            <Clock className={`w-6 h-6 text-${color}-400 relative z-10`} />
                        </div>
                    )}

                    {/* Numeric Value */}
                    <div className="flex flex-col">
                        {variant === 'timer' && !isZero ? (
                            <span className="text-2xl font-mono font-bold text-white tracking-tight tabular-nums">
                                {Math.floor(Number(value) / 60)}<span className="text-slate-600 mx-0.5 animate-pulse">:</span>{(Number(value) % 60).toFixed(0).padStart(2, '0')}
                            </span>
                        ) : (
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-mono font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                                    {isZero && variant === 'timer' ? '--:--' : value}
                                </span>
                                {total && <span className="text-xs font-mono text-slate-500 font-medium">/ <span className="text-slate-400">{total}</span></span>}
                            </div>
                        )}
                        <span className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isZero ? 'text-slate-700' : `text-${color}-400/60`}`}>
                            {isZero ? 'WAITING FOR DATA' : sub}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Active Line - Pro Style */}
            {!isZero && (
                <div className={`absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent w-full animate-[shimmer_3s_infinite]`} />
            )}
        </div>
    );
};

const LiveSessionID = () => {
    const [scramble, setScramble] = useState("initiating...");
    const [stableId] = useState(() => Math.random().toString(36).substr(2, 6).toUpperCase());

    useEffect(() => {
        const interval = setInterval(() => {
            setScramble(Math.random().toString(36).substr(2, 4).toUpperCase());
        }, 120);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 mt-1">
            <div className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B0F19] border border-white/5 hover:border-emerald-500/20 transition-all duration-300">
                <div className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 h-2 bg-emerald-500 animate-[count-pulse_0.6s_ease-in-out_infinite]" />
                    <span className="w-0.5 h-3 bg-emerald-500/50 animate-[count-pulse_0.8s_ease-in-out_infinite]" />
                    <span className="w-0.5 h-1.5 bg-emerald-500/20 animate-[count-pulse_1s_ease-in-out_infinite]" />
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">SECURE LINK</span>
                    <div className="h-3 w-[1px] bg-slate-800" />
                    <span className="text-[10px] font-mono text-slate-300 tracking-wider">
                        <span className="text-emerald-500/80">{stableId}-</span>
                        <span className="opacity-60">{scramble}</span>
                    </span>
                </div>

                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse ml-1" />
            </div>
        </div>
    );
};

const SystemTelemetry = () => {
    const [ping, setPing] = useState(24);
    const [activityIndex, setActivityIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPing(prev => Math.max(12, Math.min(prev + (Math.random() > 0.5 ? 2 : -2), 48)));
            setActivityIndex(prev => (prev + 1) % 4);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3 mt-1.5 animate-fade-in">
            {/* Connection Status Pill */}
            <div className="group flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0B0F19]/80 border border-white/5 hover:border-emerald-500/20 transition-all duration-300 shadow-lg backdrop-blur-md">

                {/* Ping Indicator */}
                <div className="flex items-center gap-2 pr-3 border-r border-white/5">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                        <span className={`font-bold ${ping < 30 ? 'text-emerald-400' : 'text-amber-400'}`}>{ping}ms</span>
                        <span className="hidden sm:inline text-slate-600 ml-1">LATENCY</span>
                    </span>
                </div>

                {/* Region */}
                <div className="flex items-center gap-2 pr-3 border-r border-white/5 hidden sm:flex">
                    <Activity className="w-3 h-3 text-slate-500" />
                    <span className="font-mono text-[10px] text-slate-400">
                        ASIA-SE1 <span className="text-slate-600">::</span> OPTIMIZED
                    </span>
                </div>

                {/* Encryption Pulse */}
                <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-emerald-500/80" />
                    <span className="font-mono text-[10px] text-emerald-500/60 tracking-wider">
                        AES-256
                    </span>
                </div>
            </div>

            {/* Packet Visualizer (Tiny) */}
            <div className="flex gap-0.5 items-end h-4 opacity-50">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className={`w-0.5 bg-emerald-500/50 transition-all duration-300 ease-in-out`}
                        style={{
                            height: i === activityIndex + 1 ? '100%' : '30%',
                            opacity: i === activityIndex + 1 ? 1 : 0.3
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default MissionControl;
