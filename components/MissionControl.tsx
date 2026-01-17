import React, { useEffect, useRef, useState } from 'react';
import { Activity, Terminal, Shield, Zap, CheckCircle, Clock, Disc, Cpu, AlertCircle, Settings } from 'lucide-react';

interface MissionLog {
    msg: string;
    status: string;
    count: number;
    timestamp: number;
}

interface MissionControlProps {
    logs: MissionLog[];
    targetCount: number;
    onAbort: () => void;
    onBackToConfig: () => void;
    onNewMission: () => void;
    formTitle: string;
}

const MissionControl: React.FC<MissionControlProps> = ({ logs, targetCount, onAbort, onBackToConfig, onNewMission, formTitle }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    const currentCount = logs.length > 0 ? logs[logs.length - 1].count : 0;
    const currentStatus = logs.length > 0 ? logs[logs.length - 1].status : 'INITIALIZING';
    const progress = (currentCount / targetCount) * 100;

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

    // Center viewport on completion/abort
    useEffect(() => {
        if (currentStatus === 'DONE' || currentStatus === 'ABORTED') {
            setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300); // Slight delay for the overlay animation to start
        }
    }, [currentStatus]);

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
            {/* SUCCESS OVERLAY */}
            {currentStatus === 'DONE' && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]/90 backdrop-blur-xl animate-fade-in border border-emerald-500/20 rounded-2xl shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
                        <div className="relative bg-emerald-500/20 p-6 rounded-full border border-emerald-500/30 animate-bounce">
                            <CheckCircle className="w-16 h-16 text-emerald-500" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-white mb-4 tracking-tight text-center">Task Completed Successfully</h2>
                    <div className="flex flex-col items-center gap-2 mb-10 text-center px-12">
                        <p className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] font-bold">
                            Total Duration: {logs.length > 1 ? Math.floor((logs[logs.length - 1].timestamp - logs[0].timestamp) / 1000) : elapsedTime} Seconds
                        </p>
                        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                            The automation process has successfully submitted all {targetCount} form entries. The operation is now finished and all records have been anchored.
                        </p>
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
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse" />
                        <div className="relative bg-red-500/20 p-6 rounded-full border border-red-500/30">
                            <AlertCircle className="w-16 h-16 text-red-500" />
                        </div>
                    </div>
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
                                ${currentStatus === 'DONE' ? 'text-emerald-500' :
                                    currentStatus === 'ABORTED' ? 'text-red-500' :
                                        'text-amber-500'}`}>
                                {currentStatus === 'DONE' ? 'Mission Complete' :
                                    currentStatus === 'ABORTED' ? 'Mission Interrupted' :
                                        'Mission Active'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-white tracking-tight">{formTitle}</h2>
                        <p className="text-xs text-slate-400 font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
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
                        <button
                            onClick={onAbort}
                            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all duration-300"
                        >
                            <AlertCircle className="w-4 h-4" />
                            Abort Mission
                        </button>
                    )}
                </div>
            </div>

            {/* ACTIVE MONITORING DISCLAIMER */}
            {currentStatus !== 'DONE' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4 animate-pulse">
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


            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<CheckCircle className="text-emerald-500" />}
                    label="Submissions"
                    value={`${currentCount}/${targetCount}`}
                    sub="Successful Links"
                />
                <StatCard
                    icon={<Zap className="text-amber-500" />}
                    label="Neural Speed"
                    value={`${(currentCount / (elapsedTime / 60 || 1)).toFixed(1)}`}
                    sub="Responses / Min"
                />
                <StatCard
                    icon={<Cpu className="text-blue-500" />}
                    label="Current Step"
                    value={currentStatus.replace('RUNNING', 'EXECUTING')}
                    sub="Active Process"
                />
                <StatCard
                    icon={<Shield className="text-purple-500" />}
                    label="Protection"
                    value="ENCRYPTED"
                    sub="Stealth Mode"
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.3); }
      `}</style>
        </div>
    );
};

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) => (
    <div className="glass-panel p-6 rounded-2xl border-white/5 hover:border-amber-500/30 transition-all duration-500 group">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">{label}</span>
        </div>
        <div className="text-2xl font-bold text-white mb-1 tracking-tight">{value}</div>
        <div className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">{sub}</div>
    </div>
);

export default MissionControl;
