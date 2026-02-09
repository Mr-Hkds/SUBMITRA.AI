import React from 'react';
import { Settings, LogOut, Crown, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
    reset: () => void;
    step: number;
    version: string;
    user: User | null;
    loading: boolean;
    onLogout: () => void;
    onShowPricing: () => void;
    onSignInClick: () => void;
    onDashboardClick: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ reset, step, version, user, loading, onLogout, onShowPricing, onSignInClick, onDashboardClick }) => {
    return (
        <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-6 flex justify-center pointer-events-none">
            <div className="w-full max-w-6xl glass-panel-premium backdrop-blur-xl bg-[#030303]/80 border border-white/5 shadow-2xl rounded-2xl md:rounded-full px-4 md:px-6 py-3 flex items-center justify-between pointer-events-auto transition-all duration-300 hover:border-white/10 hover:bg-[#050505]/90">

                {/* LOGO & BRAND */}
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={reset}
                >
                    {/* Synaptic Loop Logo */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 w-full h-full bg-gradient-to-br from-slate-900 to-black rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-emerald-400" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" className="opacity-50" />
                                <path d="M12 6a6 6 0 0 0-6 6c0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" className="group-hover:text-amber-400 transition-colors duration-500" />
                                <circle cx="12" cy="12" r="2" className="fill-emerald-500/20 stroke-emerald-400 group-hover:fill-amber-500/20 group-hover:stroke-amber-400 transition-colors duration-500" />
                            </svg>
                            {/* Sheen */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer-flow pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-lg tracking-tight leading-none text-white group-hover:text-emerald-100 transition-colors">
                                AutoForm <span className="text-emerald-500">.AI</span>
                            </span>
                            <span className="text-[7px] font-mono text-emerald-500/60 border border-emerald-500/20 px-1 rounded bg-emerald-500/5 mt-0.5">
                                {version}
                            </span>
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono uppercase tracking-[0.2em] hidden sm:block">
                            A <span className="text-amber-500/80">BHARAMRATRI</span> PRODUCTION
                        </span>
                    </div>
                </div>

                {/* NAVIGATION */}
                <div className="flex items-center gap-3 md:gap-6">
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
                            <div className="h-8 w-8 bg-white/5 rounded-full animate-pulse" />
                        </div>
                    ) : user ? (
                        <>
                            {/* Token Button with Trust Indicator */}
                            {/* Token Button with Trust Indicator */}
                            <button
                                onClick={onShowPricing}
                                className="flex flex-col items-end md:items-end group/token transition-transform hover:scale-105 active:scale-95"
                            >
                                <div className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-4 md:py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                    <Crown className="w-3.5 h-3.5 text-amber-500 group-hover/token:rotate-12 transition-transform" />
                                    <span className="text-[11px] md:text-xs font-mono font-bold text-amber-200 flex items-center">
                                        <span className="hidden sm:inline">Add Tokens</span>
                                        <span className="hidden sm:inline text-amber-500 mx-1.5">|</span>
                                        {user.tokens ?? 0}
                                    </span>
                                </div>
                            </button>

                            {/* User Profile */}
                            <div className="flex items-center gap-1.5 md:gap-3 pl-2 md:pl-6 border-l border-white/5">
                                {user.isAdmin && (
                                    <button
                                        onClick={onDashboardClick}
                                        className="p-1.5 md:p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                        title="Admin Dashboard"
                                    >
                                        <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                )}

                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-xs font-medium text-white">{user.displayName}</div>
                                        <div className="text-[10px] text-slate-500">{user.email}</div>
                                    </div>

                                    <div className="relative group/avatar">
                                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center overflow-hidden">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-4 h-4 text-slate-400" />
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={onLogout}
                                        className="p-1.5 md:p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={onSignInClick}
                            className="group relative px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-full hover:bg-slate-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] overflow-hidden"
                        >
                            <span className="relative z-10">Sign In</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-sheen-sweep pointer-events-none" />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
});

export default Header;
