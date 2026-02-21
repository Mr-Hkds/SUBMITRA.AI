import React, { useState, useEffect, useRef } from 'react';

const VERSION = "4.0.5";

import { Bot, Copy, CheckCircle, AlertCircle, BarChart3, ArrowRight, ArrowLeft, RotateCcw, Sparkles, Code2, Terminal, Zap, Command, Activity, Cpu, Crown, LogOut, Settings, Lock, Laptop, Monitor, Target, ShieldCheck, ExternalLink, Rocket, Shield, FileText, ChevronRight, Clock, CheckCircle2, ChevronDown, Eye, Code, FileJson, Fingerprint, Network, TerminalSquare, ShieldAlert } from 'lucide-react';
import { fetchAndParseForm } from './services/formParser';
import { analyzeForm as analyzeFormWithStatistics, generateResponseSuggestions } from './services/analysisService';
import { generateAutomationScript } from './utils/scriptTemplate';
import { generateIndianNames } from './utils/indianNames';
import { generateAIPrompt, parseAIResponse } from './utils/parsingUtils';
import { signInWithGoogle, logout, subscribeToUserProfile, incrementUsageCount, trackAuthState, submitTokenRequest, checkPendingRequest } from './services/authService';
import { generateScriptToken, checkRateLimit, getTokenExpirationHours, TokenMetadata } from './services/securityService';
import { FormAnalysis, User } from './types';

// PaymentModal removed for ethical reasons
import LoadingScreen from './components/LoadingScreen';
import AdminDashboard from './pages/AdminDashboard';
import HeroSection from './components/HeroSection';
import VideoModal from './components/VideoModal';
import MissionControl from './components/MissionControl';
import Header from './components/Header';
import PremiumBackground from './components/PremiumBackground';
import LegalPage from './components/LegalPage';
import MatrixReveal from './components/MatrixReveal';
import Step2Dashboard from './components/Step2Dashboard';

// --- VISUAL COMPONENTS ---


const Badge = ({ children, color = "obsidian" }: { children?: React.ReactNode, color?: "obsidian" | "gold" | "premium" }) => {
    const styles = {
        obsidian: "bg-white/5 text-slate-400 border-white/5",
        gold: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        premium: "bg-gradient-to-r from-amber-500/10 to-purple-500/10 text-amber-100 border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] font-semibold border backdrop-blur-md ${styles[color]}`}>
            {children}
        </span>
    );
};

// --- AUTH COMPONENTS ---

const LoginModal = ({ onClose, onLogin }: { onClose: () => void, onLogin: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onLogin();
            onClose(); // Close modal on success
        } catch (err: any) {
            console.error(err);
            setError("Login failed. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl relative z-10">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition">✕</button>

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif text-white mb-2">Welcome Back</h3>
                    <p className="text-slate-400 text-sm">Sign in to access your dashboard</p>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white text-slate-900 hover:bg-slate-50 font-medium h-12 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] shadow-lg"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                        By continuing, you agree to our <span className="text-amber-500/80 cursor-pointer hover:text-amber-400 transition">Terms of Service</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};

const RecommendationModal = ({ onClose, onSelect }: { onClose: () => void, onSelect: (val: number) => void }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)] relative z-10">
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <ShieldCheck className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-xl font-serif font-bold text-white mb-2">Academic Safety Guide</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                        To avoid suspicion, use realistic response volumes. Teachers often track "round numbers" and "impossible growth" patterns.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 w-full">
                    {[
                        { label: 'High School / Small Project', range: '35 - 45', val: 42, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                        { label: 'Undergraduate / College', range: '115 - 135', val: 127, color: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
                        { label: 'Post-Grad / Professional', range: '175 - 195', val: 184, color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => { onSelect(item.val); onClose(); }}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${item.color}`}
                        >
                            <div className="text-left">
                                <div className="text-[10px] font-bold uppercase tracking-wider">{item.label}</div>
                                <div className="text-[10px] opacity-70">Recommended: {item.range}</div>
                            </div>
                            <div className="text-lg font-bold font-mono">Set {item.val}</div>
                        </button>
                    ))}
                </div>

                <div className="text-[9px] text-slate-500 italic">
                    Tip: Round numbers (50, 100) are easily detectable as fakes. Our algorithm adds "jitter" to the data, but the total count should also seem organic.
                </div>

                <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest mt-2">Close Guide</button>
            </div>
        </div>
    </div>
);



// --- APP COMPONENTS ---


const Footer = React.memo(({ onLegalNav }: { onLegalNav: (type: 'privacy' | 'terms' | 'refund' | 'contact' | null) => void }) => (
    <footer className="w-full py-12 mt-auto border-t border-white/5 relative z-10 bg-black overflow-hidden mb-20 md:mb-0">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center relative z-10">

            {/* Main Branding - Centered & Prestigious */}
            <div className="flex flex-col items-center gap-4 mb-8 group cursor-default">
                <div className="relative">
                    <div className="absolute -inset-4 bg-amber-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        <span className="text-xs text-slate-300 font-sans tracking-[0.3em] font-bold uppercase group-hover:text-white">
                            AutoForm . AI
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    </div>
                </div>

                <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-amber-500/50" />

                <span className="text-xs md:text-sm text-amber-500/90 font-serif italic tracking-widest hover:text-amber-400 transition-colors">
                    A Bharamratri Production
                </span>
            </div>

            {/* Links - Minimalist */}
            <div className="flex items-center gap-8 text-[9px] text-slate-600 font-medium tracking-widest uppercase mb-8">
                <a
                    href="/privacy-policy"
                    onClick={(e) => { e.preventDefault(); onLegalNav('privacy'); }}
                    className="hover:text-white transition-colors cursor-pointer hover:underline underline-offset-4 decoration-amber-500/50"
                >
                    Privacy Protocol
                </a>
                <a
                    href="/terms-of-service"
                    onClick={(e) => { e.preventDefault(); onLegalNav('terms'); }}
                    className="hover:text-white transition-colors cursor-pointer hover:underline underline-offset-4 decoration-amber-500/50"
                >
                    Service Terms
                </a>
                <a
                    href="/refund-policy"
                    onClick={(e) => { e.preventDefault(); onLegalNav('refund'); }}
                    className="hover:text-white transition-colors cursor-pointer hover:underline underline-offset-4 decoration-amber-500/50"
                >
                    Refund Policy
                </a>
                <a
                    href="/contact-us"
                    onClick={(e) => { e.preventDefault(); onLegalNav('contact'); }}
                    className="hover:text-white transition-colors cursor-pointer hover:underline underline-offset-4 decoration-amber-500/50"
                >
                    Contact Us
                </a>
            </div>

            {/* Disclaimer Section - System Alert Style */}
            <div className="max-w-4xl mx-auto px-4 mt-8 mb-12">
                <div className="border border-white/5 bg-white/[0.02] rounded-sm p-5 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
                    <div className="flex items-start gap-4">
                        <div className="mt-0.5 text-amber-500/80 font-mono text-xs">[!]</div>
                        <div className="text-[10px] md:text-xs text-slate-400 font-mono leading-relaxed text-left">
                            <strong className="text-amber-500/90 block mb-2 tracking-widest uppercase text-[9px]">Operational Directive // Educational Use Only</strong>
                            The AutoForm Automation Suite is strictly engineered for <span className="text-slate-200">statistical analysis and educational research</span> purposes.
                            The deployment of this technology implies full user consent and responsibility for compliance with all relevant Terms of Service and legal frameworks.
                            Bharamratri Productions assumes no liability for the operational misuse or unauthorized application of this system.
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature Section - The "Showpiece" */}
            <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col items-center">
                <p className="text-[9px] text-slate-600 tracking-[0.2em] font-medium uppercase font-sans mb-3">
                    Designed & Engineered by
                </p>
                <div className="group relative cursor-pointer">
                    {/* Liquid Gold Glow */}
                    <div className="absolute -inset-8 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 blur-2xl opacity-0 group-hover:opacity-100" />

                    {/* Signature Text */}
                    <MatrixReveal
                        text="BLACK_LOTUS"
                        className="relative z-10 text-lg md:text-xl font-bold liquid-gold-text drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                    />
                </div>
            </div>


            {/* Version System Tag */}
            <div className="absolute bottom-2 right-4 opacity-80 hover:opacity-100 transition-opacity">
                <span className="text-[9px] text-slate-500 font-mono tracking-[0.2em] uppercase">

                </span>
            </div>
        </div>
    </footer>
));

// DELETED: LoadingState replaced by LoadingScreen component

function App() {
    const LAUNCH_HANDOFF_MS = 4000;
    const LAUNCH_OVERLAY_MS = 4500;
    const LAUNCH_STAGES = ['Integrity Check', 'Handshake', 'Pipeline Sync', 'Mission Boot'];
    const LAUNCH_ACTIVITIES = [
        'auth token sealed',
        'response payload indexed',
        'runner context primed',
        'handoff to mission control'
    ];

    // User State
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [aiProgress, setAiProgress] = useState<string>('');
    const [showTokenRequest, setShowTokenRequest] = useState(false);
    const [tokenRequestAmount, setTokenRequestAmount] = useState<number>(50);
    const [tokenRequestStatus, setTokenRequestStatus] = useState<'idle' | 'checking' | 'submitting' | 'success' | 'error' | 'pending_exists'>('idle');
    const [tokenRequestMessage, setTokenRequestMessage] = useState('');
    const [showLogin, setShowLogin] = useState(false);

    // Check for pending requests when modal opens
    useEffect(() => {
        const checkExisting = async () => {
            if (showTokenRequest && user) {
                setTokenRequestStatus('checking');
                const hasPending = await checkPendingRequest(user.uid);
                if (hasPending) {
                    setTokenRequestStatus('pending_exists');
                    setTokenRequestMessage("You already have an active token request pending administrator approval.");
                } else {
                    setTokenRequestStatus('idle');
                    setTokenRequestMessage('');
                }
            }
        };
        checkExisting();
    }, [showTokenRequest, user]);

    // Access Control
    const [isSiteUnlocked, setIsSiteUnlocked] = useState(() => {
        return localStorage.getItem('NAAGRAAZ_ACCESS_KEY') === 'root-access';
    });
    const [accessKeyInput, setAccessKeyInput] = useState('');
    // REMOVED EXTENSION DETECTION - NOW USING SYSTEM NATIVE ENGINE
    const isExtensionInstalled = false; // Forced false to bypass logic
    const [stopAutomation, setStopAutomation] = useState(false);


    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [showRecommendationModal, setShowRecommendationModal] = useState(false);
    const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'refund' | 'contact' | null>(null);

    // App State
    const [url, setUrl] = useState('');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0); // Real progress tracking
    const [generatedNames, setGeneratedNames] = useState<string[]>([]); // Added for Gold Edition
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<FormAnalysis | null>(null);
    const [targetCount, setTargetCount] = useState(10);
    const [delayMin, setDelayMin] = useState(500);
    const [nameSource, setNameSource] = useState<'auto' | 'indian' | 'custom'>('auto');
    const [customNamesRaw, setCustomNamesRaw] = useState('');
    const [speedMode, setSpeedMode] = useState<'auto' | 'manual'>('auto');
    const [isLaunching, setIsLaunching] = useState(false);
    const [launchProgress, setLaunchProgress] = useState(0);
    const launchFrameRef = useRef<number | null>(null);
    const launchStepTimerRef = useRef<number | null>(null);
    const launchRunTimerRef = useRef<number | null>(null);
    const launchPayloadRef = useRef<Record<string, string> | null>(null);

    // NEW: AI Data Context State
    const [aiPromptData, setAiPromptData] = useState('');
    const [parsingError, setParsingError] = useState<string | null>(null);

    const [copied, setCopied] = useState(false);
    const [currentToken, setCurrentToken] = useState<TokenMetadata | null>(null);
    const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [questionSearch, setQuestionSearch] = useState('');

    // AUTOMATION STATE
    const [isAutoRunning, setIsAutoRunning] = useState(false);
    const [automationLogs, setAutomationLogs] = useState<any[]>([]);
    const [visualTokenOverride, setVisualTokenOverride] = useState<number | null>(null);

    useEffect(() => {
        const handleMissionUpdate = (event: MessageEvent) => {
            if (event.data?.type === 'AF_MISSION_CONTROL_UPDATE') {
                const data = event.data.payload;

                setAutomationLogs(prev => {
                    // Check if this log already exists (to prevent duplicates)
                    const isDuplicate = prev.some(l => l.timestamp === data.timestamp && l.msg === data.msg);
                    if (isDuplicate) return prev;
                    return [...prev, data];
                });

                // If the script signals DONE, we can handle it here if needed
                if (data.status === 'DONE') {
                    // handle completion
                }
            }
        };

        window.addEventListener('message', handleMissionUpdate);
        return () => window.removeEventListener('message', handleMissionUpdate);
    }, []);

    useEffect(() => {
        // Detect Legal Pages via URL
        const path = window.location.pathname;
        if (path === '/privacy-policy') setLegalType('privacy');
        else if (path === '/terms-of-service') setLegalType('terms');
        else if (path === '/refund-policy') setLegalType('refund');
        else if (path === '/contact-us') setLegalType('contact');

        // Handle browser back/forward
        const handlePopState = () => {
            const newPath = window.location.pathname;
            if (newPath === '/privacy-policy') setLegalType('privacy');
            else if (newPath === '/terms-of-service') setLegalType('terms');
            else if (newPath === '/refund-policy') setLegalType('refund');
            else if (newPath === '/contact-us') setLegalType('contact');
            else setLegalType(null);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    useEffect(() => {
        if (!isLaunching) {
            setLaunchProgress(0);
            if (launchFrameRef.current !== null) {
                cancelAnimationFrame(launchFrameRef.current);
                launchFrameRef.current = null;
            }
            return;
        }

        const start = performance.now();
        const tick = (now: number) => {
            const raw = Math.min((now - start) / LAUNCH_HANDOFF_MS, 1);
            const eased = 1 - Math.pow(1 - raw, 2.2);
            const stageBoost = raw < 0.9 ? (Math.sin(now / 180) + 1) * 0.15 : 0;
            const targetPercent = Math.min(100, Math.round(eased * 100 + stageBoost));

            setLaunchProgress(prev => (targetPercent > prev ? targetPercent : prev));

            if (raw < 1) {
                launchFrameRef.current = requestAnimationFrame(tick);
            } else {
                launchFrameRef.current = null;
            }
        };

        launchFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (launchFrameRef.current !== null) {
                cancelAnimationFrame(launchFrameRef.current);
                launchFrameRef.current = null;
            }
        };
    }, [isLaunching]);

    useEffect(() => {
        return () => {
            if (launchStepTimerRef.current !== null) {
                window.clearTimeout(launchStepTimerRef.current);
            }
            if (launchRunTimerRef.current !== null) {
                window.clearTimeout(launchRunTimerRef.current);
            }
            if (launchFrameRef.current !== null) {
                cancelAnimationFrame(launchFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isLaunching) return;

        const handleLaunchKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                void continueLaunchNow();
            }
        };

        window.addEventListener('keydown', handleLaunchKeyDown);
        return () => window.removeEventListener('keydown', handleLaunchKeyDown);
    }, [isLaunching]);

    const activeLaunchStageIndex = Math.min(
        LAUNCH_STAGES.length - 1,
        Math.floor((launchProgress / 100) * LAUNCH_STAGES.length)
    );
    const currentLaunchStage = LAUNCH_STAGES[activeLaunchStageIndex];
    const launchEta = Math.max(0, (((100 - launchProgress) / 100) * (LAUNCH_HANDOFF_MS / 1000))).toFixed(1);
    const launchStatusLabel = launchProgress >= 96 ? 'System: Armed' : `System: ${currentLaunchStage}`;

    const clearLaunchSequence = () => {
        if (launchStepTimerRef.current !== null) {
            window.clearTimeout(launchStepTimerRef.current);
            launchStepTimerRef.current = null;
        }
        if (launchRunTimerRef.current !== null) {
            window.clearTimeout(launchRunTimerRef.current);
            launchRunTimerRef.current = null;
        }
        if (launchFrameRef.current !== null) {
            cancelAnimationFrame(launchFrameRef.current);
            launchFrameRef.current = null;
        }
    };

    const continueLaunchNow = async () => {
        if (!launchPayloadRef.current) return;

        clearLaunchSequence();
        setLaunchProgress(100);
        setStep(3);
        setIsLaunching(false);

        try {
            await handleAutoRun(launchPayloadRef.current);
        } catch (err) {
            console.error('Auto-Run failed', err);
        } finally {
            launchPayloadRef.current = null;
        }
    };

    const handleLegalNav = (type: 'privacy' | 'terms' | 'refund' | 'contact' | null) => {
        setLegalType(type);
        if (type) {
            const urls = {
                privacy: '/privacy-policy',
                terms: '/terms-of-service',
                refund: '/refund-policy',
                contact: '/contact-us'
            };
            window.history.pushState({}, '', urls[type]);
        } else {
            window.history.pushState({}, '', '/');
        }
        scrollToTop();
    };

    const handleAbort = () => {
        (window as any).__AF_STOP_SIGNAL = true;
        setAutomationLogs(prev => [...prev, { msg: 'MISSION ABORTED BY USER. TERMINATING THREADS...', status: 'ERROR', timestamp: Date.now(), count: prev.length > 0 ? prev[prev.length - 1].count : 0 }]);
    };



    const loadingMessages = [
        "Initializing Secure Handshake...",
        "Synchronizing Neural Core...",
        "Calibrating Optical Systems...",
        "Finalizing Protocol Links...",
        "Accessing Mission Terminal..."
    ];

    const handleLogin = async () => {
        // Error handling is managed by the calling component (LoginModal)
        try {
            const loggedInUser = await signInWithGoogle();
            setUser(loggedInUser);
        } catch (e) {
            console.error("Login flow error:", e);
        }
    };

    useEffect(() => {
        // Persistent Login Listener
        const unsub = trackAuthState((restoredUser) => {
            setUser(restoredUser);
            setAuthLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (user?.uid) {
            const unsub = subscribeToUserProfile(user.uid, (updatedUser) => {
                if (updatedUser) setUser(updatedUser);
            });

            return () => unsub();
        }
    }, [user?.uid]);

    // Enforce Token Limits
    useEffect(() => {
        if (user) {
            // Check if user has enough tokens for current target
            const maxPossible = user.tokens || 0;
            if (targetCount > maxPossible) {
                setTargetCount(maxPossible > 0 ? maxPossible : 0);
            }
        }
    }, [user?.tokens, targetCount]);

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setStep(1);
        setUrl('');
        setShowAdminDashboard(false);
    };

    // Auto-calculate speed based on mission scale
    useEffect(() => {
        if (speedMode === 'auto' && analysis) {
            const totalOps = analysis.questions.length * targetCount;
            let bestDelay = 500; // Rapid (Safe) - previously 1000ms

            if (totalOps > 200) bestDelay = 0; // Warp Drive
            else if (totalOps > 100) bestDelay = 50; // Intensive (Turbo)
            else if (totalOps > 20) bestDelay = 200; // Balanced (Agile)

            setDelayMin(bestDelay);
        }
    }, [speedMode, targetCount, analysis?.questions.length]);

    const handleTokenRequest = async () => {
        if (!user || tokenRequestStatus === 'pending_exists') return;
        if (tokenRequestAmount < 1 || tokenRequestAmount > 200) {
            setTokenRequestMessage("Amount must be between 1 and 200.");
            setTokenRequestStatus('error');
            return;
        }

        setTokenRequestStatus('submitting');
        const result = await submitTokenRequest(user, tokenRequestAmount);

        if (result.success) {
            setTokenRequestStatus('success');
            setTokenRequestMessage(result.message);
            setTimeout(() => {
                setShowTokenRequest(false);
                setTokenRequestStatus('idle');
                setTokenRequestMessage('');
            }, 3000);
        } else {
            setTokenRequestStatus('error');
            setTokenRequestMessage(result.message);
        }
    };

    const checkBalanceAndRedirect = (val: number) => {
        if (user && val > (user.tokens || 0)) {
            setShowTokenRequest(true);
            return true;
        }
        return false;
    };

    const smartDelay = async (ms: number) => {
        const start = Date.now();
        while (Date.now() - start < ms) {
            if ((window as any).__AF_STOP_SIGNAL) return;
            await new Promise(r => setTimeout(r, 100)); // Check every 100ms
        }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        checkBalanceAndRedirect(val);
        setTargetCount(val);
    };

    const handleAnalyze = async () => {
        if (!url) return;

        // REQUIRE AUTH FOR ANALYSIS
        if (!user) {
            setShowLogin(true);
            return;
        }

        // URL Sanitization: Remove query parameters like ?usp=header
        let cleanUrl = url.trim();
        if (cleanUrl.includes('?')) {
            cleanUrl = cleanUrl.split('?')[0];
        }
        setUrl(cleanUrl); // Update state with clean URL

        setLoading(true);
        setProgress(5); // Start
        setError(null);
        setAiProgress('Fetching form data...');

        const minTimePromise = new Promise(resolve => setTimeout(resolve, 6000)); // Ensure at least 6 seconds for professional UX

        try {
            // Smooth progress animation
            const progressSteps = [
                { delay: 400, progress: 10 },
                { delay: 600, progress: 18 },
                { delay: 500, progress: 25 },
                { delay: 400, progress: 35 }
            ];

            // 1. Fetch with smooth progress
            const fetchPromise = fetchAndParseForm(url);

            // Animate progress while fetching
            for (const step of progressSteps) {
                await new Promise(r => setTimeout(r, step.delay));
                setProgress(step.progress);
            }

            const rawForm = await fetchPromise;
            setProgress(45);
            setAiProgress('Form loaded successfully');

            // 2. Analyze with smooth progress
            await new Promise(r => setTimeout(r, 600));
            setProgress(60);

            const statisticalResult = await analyzeFormWithStatistics(
                rawForm.title,
                rawForm.questions,
                undefined,
                (msg) => {
                    setAiProgress(msg);
                }
            );

            setProgress(75);
            await new Promise(r => setTimeout(r, 500));
            setProgress(85);

            setAnalysis({
                ...statisticalResult,
                hiddenFields: rawForm.hiddenFields
            });
            setAiProgress('Analysis complete!');

            await new Promise(r => setTimeout(r, 400));
            setProgress(95);

            // Ensure we waited at least the minimum time
            await minTimePromise;

            setProgress(100);

            setTimeout(() => {
                setLoading(false);
                setAiProgress('');
                setStep(2);
            }, 1000); // Slight delay at 100% to let user see "Complete"

        } catch (err: any) {
            console.warn('[App] Analysis failed:', err.message);
            setError(err.message || 'Analysis failed. Please check the URL.');

            setLoading(false);
            setAiProgress('');
        }
    };



    const [customResponses, setCustomResponses] = useState<Record<string, string>>({});

    useEffect(() => {
        if (analysis) {
            // Initialize customResponses
            const initial: Record<string, string> = {};
            // Preserve existing
            analysis.questions.forEach(q => {
                if ((q.type === 'SHORT_ANSWER' || q.type === 'PARAGRAPH') && !q.title.toLowerCase().includes('name')) {
                    if (!customResponses[q.id]) initial[q.id] = "";
                }
            });
            if (Object.keys(initial).length > 0) {
                setCustomResponses(prev => ({ ...prev, ...initial }));
            }
        }
    }, [analysis]);


    const handleCopy = async (overrides?: Record<string, string>): Promise<boolean> => {
        if (!analysis || !user) return false;

        // Check rate limit
        const rateCheck = await checkRateLimit(user.uid);
        if (!rateCheck.allowed) {
            setError(`Rate limit: Please wait ${rateCheck.cooldownRemaining} seconds before generating another script`);
            setRateLimitCooldown(rateCheck.cooldownRemaining || 0);
            setTimeout(() => setError(null), 3000);
            return false;
        }

        // Check token balance logic
        if ((user.tokens || 0) < targetCount) {
            setShowTokenRequest(true);
            return false;
        }

        setLoading(true);

        try {
            // Generate secure token
            const token = await generateScriptToken(user.uid, url, targetCount);
            setCurrentToken(token);

            const expirationHours = getTokenExpirationHours(token.expiresAt);
            console.log(`✅ Secure token generated. Expires in ${expirationHours} hours.`);

            // Generate Names based on Source
            let namesToUse: string[] = [];

            if (nameSource === 'auto') {
                if (namesToUse.length === 0 && generatedNames.length > 0) namesToUse = generatedNames;
                if (namesToUse.length < targetCount && analysis.questions.some(q => q.title.toLowerCase().includes('name'))) {
                    namesToUse = await generateResponseSuggestions("local-mode", targetCount, 'NAMES');
                    setGeneratedNames(namesToUse);
                }
            } else if (nameSource === 'indian') {
                namesToUse = generateIndianNames(targetCount);
            } else if (nameSource === 'custom') {
                namesToUse = customNamesRaw.split(',').map(n => n.trim()).filter(n => n.length > 0);
            }

            // Process Custom Fields
            const processedCustomResponses: Record<string, string[]> = {};
            const sourceResponses = overrides || customResponses; // Use overrides if provided (from handleCompile)

            Object.entries(sourceResponses).forEach(([qId, val]) => {
                if (val && (val as string).trim().length > 0) {
                    const answers = (val as string).split(',').map(v => v.trim()).filter(v => v.length > 0);
                    if (answers.length > 0) {
                        processedCustomResponses[qId] = answers;
                    }
                }
            });

            const script = generateAutomationScript(analysis, {
                targetCount,
                delayMin,
                delayMax: delayMin + 500,
                names: namesToUse,
                nameSource,
                customFieldResponses: processedCustomResponses
            }, url, token);

            await navigator.clipboard.writeText(script);
            setCopied(true);

            // Deduct Tokens (will be verified when script runs)
            incrementUsageCount(user.uid, targetCount);

            setTimeout(() => setCopied(false), 2000);
            return true;

        } catch (err: any) {
            console.error("Copy Error:", err);
            setError("Failed to generate script. Please try again.");
        } finally {
            setLoading(false);
        }
        return false;
    };

    const executeNativeSubmission = async (url: string, data: Record<string, string | string[]>) => {
        return new Promise((resolve, reject) => {
            const iframeName = `af_bridge_${Math.random().toString(36).substring(7)}`;
            const iframe = document.createElement('iframe');
            iframe.name = iframeName;
            iframe.id = iframeName;
            iframe.style.display = 'none';

            // Error detection for iframe
            let hasError = false;
            const errorHandler = () => {
                hasError = true;
                if (document.body.contains(iframe)) {
                    cleanup();
                    reject(new Error("Network connection lost or blocked."));
                }
            };

            iframe.onerror = errorHandler;

            document.body.appendChild(iframe);

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = url.split('?')[0].replace(/\/viewform$/, '/formResponse'); // Action URL
            form.target = iframeName;

            Object.entries(data).forEach(([key, value]) => {
                const isSpecial = key.includes('entry.') || key === 'emailAddress';
                const inputName = isSpecial ? key : `entry.${key}`;

                if (Array.isArray(value)) {
                    value.forEach(v => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = inputName;
                        input.value = v;
                        form.appendChild(input);
                    });
                } else {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = inputName;
                    input.value = value as string;
                    form.appendChild(input);
                }
            });

            // Add page history to ensure submission works for multi-page forms
            // If the form has questions on pages 0, 1, 2... pageHistory should be 0,1,2
            const maxPageIndex = analysis?.questions.reduce((max, q) => Math.max(max, q.pageIndex || 0), 0) || 0;
            const pageHistory = Array.from({ length: maxPageIndex + 1 }, (_, i) => i).join(',');

            const hist = document.createElement('input');
            hist.type = 'hidden';
            hist.name = 'pageHistory';
            hist.value = pageHistory;
            form.appendChild(hist);

            document.body.appendChild(form);

            const cleanup = () => {
                if (document.body.contains(form)) document.body.removeChild(form);
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
            };

            try {
                form.submit();
                // Since we can't read the response due to CORS, we assume it's sent
                // if the iframe doesn't trigger an error within 2.5 seconds
                setTimeout(() => {
                    if (!hasError) {
                        cleanup();
                        resolve(true);
                    }
                }, 2500);
            } catch (e) {
                console.error("Native Submission Error:", e);
                cleanup();
                reject(e);
            }
        });
    };

    const handleAutoRun = async (overrides?: Record<string, string>) => {
        if (!analysis || !user) return;

        // basic validations
        const rateCheck = await checkRateLimit(user.uid);
        if (!rateCheck.allowed) {
            setError(`Rate limit: Wait ${rateCheck.cooldownRemaining}s`);
            return;
        }

        if ((user.tokens || 0) < targetCount) {
            setShowTokenRequest(true);
            return;
        }

        setIsAutoRunning(true);
        setStopAutomation(false);
        setAutomationLogs([]);

        const logs: any[] = [];
        let successCount = 0;
        const pushLog = (msg: string, status: string = 'RUNNING', countOverride?: number) => {
            const newLog = {
                msg,
                status,
                timestamp: Date.now(),
                count: countOverride !== undefined ? countOverride : successCount
            };
            logs.push(newLog);
            setAutomationLogs([...logs]);
        };

        pushLog('SYSTEM ENGINE: Initializing Neural Bridge...', 'INIT');

        try {
            // Setup payload generation logic
            let namesToUse: string[] = [];
            if (nameSource === 'auto') {
                if (generatedNames.length > 0) namesToUse = generatedNames;
                else {
                    namesToUse = await generateResponseSuggestions("local-mode", targetCount, 'NAMES');
                    setGeneratedNames(namesToUse);
                }
            } else if (nameSource === 'indian') {
                namesToUse = generateIndianNames(targetCount);
            } else if (nameSource === 'custom') {
                namesToUse = customNamesRaw.split(',').map(n => n.trim()).filter(n => n.length > 0);
            }

            const sourceResponses = overrides || customResponses;
            const processedCustomResponses: Record<string, string[]> = {};
            Object.entries(sourceResponses).forEach(([qId, val]) => {
                if (val && (val as string).trim().length > 0) {
                    processedCustomResponses[qId] = (val as string).split(',').map(v => v.trim()).filter(v => v.length > 0);
                }
            });

            // --- DETERMINISTIC DECK GENERATION (EXACT PERCENTAGE ADHERENCE) ---
            // We pre-calculate the exact answers for the entire batch to ensure math perfect distribution
            const questionDecks: Record<string, string[]> = {};

            analysis.questions.forEach(q => {
                if ((q.type === 'MULTIPLE_CHOICE' || q.type === 'DROPDOWN' || q.type === 'CHECKBOXES' || q.type === 'LINEAR_SCALE') && q.options.length > 0) {
                    const deck: string[] = [];

                    // 1. Calculate exact counts using Largest Remainder Method
                    const totalWeight = q.options.reduce((sum, opt) => sum + (opt.weight || 0), 0) || 100;

                    const counts = q.options.map(opt => {
                        const preciseCount = ((opt.weight || 0) / totalWeight) * targetCount;
                        return {
                            value: opt.value,
                            integer: Math.floor(preciseCount),
                            fraction: preciseCount - Math.floor(preciseCount),
                            originalWeight: opt.weight || 0
                        };
                    });

                    // Initial sum of integer parts
                    let currentTotal = counts.reduce((sum, item) => sum + item.integer, 0);
                    let remainder = targetCount - currentTotal;

                    // Sort by fraction descending to distribute remainder
                    counts.sort((a, b) => b.fraction - a.fraction);

                    // Distribute remainder
                    for (let i = 0; i < remainder; i++) {
                        counts[i].integer += 1;
                    }

                    // Build the deck
                    counts.forEach(item => {
                        for (let k = 0; k < item.integer; k++) {
                            deck.push(item.value);
                        }
                    });

                    // Shuffle the deck (Fisher-Yates)
                    for (let i = deck.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [deck[i], deck[j]] = [deck[j], deck[i]];
                    }

                    questionDecks[q.id] = deck;
                }
            });

            pushLog(`Handshake verified. Establishing secure neural link...`);
            await smartDelay(2000); // Immersion delay

            for (let i = 0; i < targetCount; i++) {
                // Check for Abort
                if ((window as any).__AF_STOP_SIGNAL) break;

                pushLog(`Response #${i + 1}: Simulating human reasoning...`);
                // Use adaptive delay based on user selection
                const baseDelay = delayMin;
                const jitter = delayMin === 0 ? 0 : Math.floor(Math.random() * 1000);
                await smartDelay(baseDelay + jitter);

                pushLog(`Response #${i + 1}: Generating optimized payload...`);

                // Generate values for this specific submission
                // Initialize submission with hidden fields (CRITICAL for valid submissions)
                const submissionData: Record<string, string | string[]> = { ...(analysis.hiddenFields || {}) };

                analysis.questions.forEach(q => {
                    let value: string | string[] = "";

                    // 1. Custom/AI overrides
                    if (processedCustomResponses[q.id]) {
                        const arr = processedCustomResponses[q.id];
                        value = arr[i % arr.length];
                    }
                    // 2. Names
                    else if (q.title.toLowerCase().includes('name')) {
                        value = namesToUse.length > 0 ? namesToUse[i % namesToUse.length] : "Auto User";
                    }
                    // 3. Emails (Added specific handling)
                    else if (q.title.toLowerCase().includes('email')) {
                        const name = namesToUse.length > 0 ? namesToUse[i % namesToUse.length].toLowerCase().replace(/\s+/g, '.') : `user${i}`;
                        const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
                        value = `${name}${Math.floor(Math.random() * 99)}@${domains[Math.floor(Math.random() * domains.length)]}`;
                    }
                    // 4. Deterministic Deck Usage
                    else if (questionDecks[q.id]) {
                        if (q.type === 'CHECKBOXES') {
                            // For checkboxes, we might want multiple options. 
                            // The deck currently gives 1 option per 'slot'. 
                            // To simulate multiple checks deterministically is complex.
                            // fallback: We take the main "deck" option, and potentially add 1 more random high-weight option if lucky.
                            // ideally, the user's weight config for checkboxes implies "Selection Frequency".

                            const primaryChoice = questionDecks[q.id][i] || q.options[0].value;
                            const selections = [primaryChoice];

                            // Optional: Add secondary selection based on raw probability
                            if (Math.random() > 0.7) {
                                const otherOptions = q.options.filter(o => o.value !== primaryChoice && (o.weight || 0) > 20);
                                if (otherOptions.length > 0) {
                                    selections.push(otherOptions[Math.floor(Math.random() * otherOptions.length)].value);
                                }
                            }
                            value = selections;
                        } else {
                            // Single choice (Radio/Dropdown) - EXACT matching
                            value = questionDecks[q.id][i] || q.options[0].value;
                        }
                    }
                    // 5. Fallback
                    else if (q.options.length > 0) {
                        value = q.options[0].value;
                    }


                    if (value) submissionData[q.entryId] = value;
                });

                // FORCE EMAIL INJECTION: Always send a valid email address parameter
                // This fixes issues where the parser might miss the "Collect Emails" setting
                // Google Forms simply ignores this if it's not needed, but it's critical if it IS needed.
                if (!submissionData['emailAddress']) {
                    const name = namesToUse.length > 0 ? namesToUse[i % namesToUse.length].toLowerCase().replace(/\s+/g, '.') : `user${i}`;
                    submissionData['emailAddress'] = `${name}${Math.floor(Math.random() * 99)}@gmail.com`;
                }

                // --- PRE-SUBMISSION VALIDATION ---
                const missingFields = analysis.questions
                    .filter(q => q.required && !submissionData[q.entryId])
                    .map(q => q.title);

                if (missingFields.length > 0) {
                    pushLog(`Response #${i + 1}: VALIDATION ERROR - Missing required fields: ${missingFields.join(', ')}`, 'ERROR', successCount);
                    // Skip this submission but continue the loop
                    continue;
                }

                pushLog(`Response #${i + 1}: Relaying to secure endpoint...`);
                try {
                    await executeNativeSubmission(url, submissionData);
                    successCount++;
                    pushLog(`Response #${i + 1}: Submission recorded.`, 'RUNNING', successCount);
                } catch (e: any) {
                    console.error("Submission failed at index", i, e);
                    pushLog(`Response #${i + 1}: ${e.message || "Relay failure"}`, 'ERROR', successCount);
                    // If we have many errors in a row, we might want to stop, but for now we continue the loop
                    // and let the user see the visual red logs.
                }

                // --- ADAPTIVE COOLDOWN (Safety Fix) ---
                // Every 15 submissions, add a "System Cooldown" to bypass IP-based rate limiting
                // Every 15 submissions, add a "System Cooldown" to bypass IP-based rate limiting
                if (successCount % 15 === 0 && successCount < targetCount && successCount > 0) {
                    const cooldownSecs = 5;
                    pushLog(`IP SAFETY: Automatic cooldown triggered. Waiting ${cooldownSecs}s to prevent blocking...`, 'COOLDOWN');
                    await smartDelay(cooldownSecs * 1000);
                } else {
                    // Optimized gap between requests
                    const gapDelay = delayMin === 0 ? 0 : Math.max(500, delayMin);
                    const jitter = delayMin === 0 ? 0 : Math.floor(Math.random() * 2000);
                    await smartDelay(gapDelay + jitter);
                }
            }

            if (!(window as any).__AF_STOP_SIGNAL) {
                if (successCount === targetCount && successCount > 0) {
                    pushLog('SEQUENCER COMPLETE. All background jobs finished.', 'DONE', targetCount);
                } else if (successCount > 0) {
                    pushLog(`MISSION FINISHED with issues. ${successCount}/${targetCount} payloads delivered.`, 'DONE', successCount);
                } else {
                    pushLog(`MISSION FAILED. 0/${targetCount} payloads delivered. Check network or form settings.`, 'ERROR', 0);
                }
            } else {
                pushLog('MISSION PARTIALLY COMPLETED. Intercepted by user.', 'ABORTED', successCount);
            }

            // ACCURATE TOKEN DEDUCTION: Only deduct what was actually sent
            if (successCount > 0) {
                // [FIX] Lock visual state to current high value so Header doesn't snap down
                // The MissionControl animation will smoothly decrement this via setVisualTokenOverride
                if (user && user.tokens) {
                    setVisualTokenOverride(user.tokens);
                }

                const result = await incrementUsageCount(user.uid, successCount);
                if (result.success && typeof result.newTokens === 'number') {
                    // Optimistic state update for Header
                    setUser(prev => prev ? { ...prev, tokens: result.newTokens as number } : null);
                }
            }

            (window as any).__AF_STOP_SIGNAL = false;
            return true;

        } catch (err) {
            console.error(err);
            pushLog('ENGINE ERROR: Neural link severed.', 'ERROR');
            setError("Auto-Run failed");
            return false;
        } finally {
            // setLoading(false);
        }
    };


    const handleCompile = async () => {
        if (!user) return;

        // Strict Limit Check
        if (targetCount <= 0) {
            setError("Configuration Error: Please specify a response count greater than 0.");
            return;
        }

        if (!user.tokens || user.tokens < targetCount) {
            setShowTokenRequest(true);
            return;
        }

        // 1. VALIDATION: Parse AI Data BEFORE anything else
        let aiParsedResponses: Record<string, string[]> = {};

        // Filter used text fields (excluding names)
        const requiredTextFields = analysis?.questions.filter(q =>
            (q.type === 'SHORT_ANSWER' || q.type === 'PARAGRAPH') &&
            !q.title.toLowerCase().includes('name') &&
            q.required
        );

        // BLOCKER: Verify AI Data is present if required
        if (requiredTextFields && requiredTextFields.length > 0 && !aiPromptData.trim()) {
            setError("⚠️ Missing Required Data: Please complete Stage 1 (AI Injection) before launching.");
            setParsingError("REQUIRED: You must inject data for mandatory text fields.");
            return;
        }

        // Parse if data exists
        if (analysis && aiPromptData.trim()) {
            try {
                aiParsedResponses = parseAIResponse(aiPromptData, analysis.questions);
                setParsingError(null);
            } catch (e: any) {
                setParsingError(`⚠️ ${e.message}`);
                // If it was required, we must stop
                if (requiredTextFields && requiredTextFields.length > 0) {
                    setError("⚠️ Critical JSON Error: Fix AI data before proceeding.");
                    return;
                }
            }
        }

        // 2. MERGE: AI Data into Custom Responses (AI overrides existing if keys match, or we can merge)
        // For now, let's treat AI data as the source of truth for populated fields
        const mergedResponses = { ...customResponses };
        Object.entries(aiParsedResponses).forEach(([qId, values]) => {
            mergedResponses[qId] = values.join(', ');
        });

        // We update the state so handleCopy picks it up
        setCustomResponses(mergedResponses);

        setAutomationLogs([]);

        // --- ATMOSPHERIC VERIFICATION SEQUENCE (4500ms) ---
        launchPayloadRef.current = mergedResponses;
        clearLaunchSequence();
        setLaunchProgress(0);
        setIsLaunching(true);

        // Sequence: 
        // 0-4000ms: Progress Animation
        // 4000ms: Page Swap
        // 4500ms: Transition End / Start Run

        launchStepTimerRef.current = window.setTimeout(() => {
            setStep(3);
        }, LAUNCH_HANDOFF_MS);

        launchRunTimerRef.current = window.setTimeout(() => {
            void continueLaunchNow();
        }, LAUNCH_OVERLAY_MS);
    };

    const handleAIInject = () => {
        if (!analysis || !aiPromptData.trim()) {
            setParsingError("⚠️ Please paste JSON data first.");
            return;
        }

        try {
            const parsed = parseAIResponse(aiPromptData, analysis.questions);
            const newResponses = { ...customResponses };
            let namesFound = false;
            let namesList: string[] = [];

            Object.entries(parsed).forEach(([qId, values]) => {
                const question = analysis.questions.find(q => q.id === qId);

                // Populate Custom Responses Map
                newResponses[qId] = values.join(', ');

                // If it's a name field, also prepare for Custom Names source
                if (question && question.title.toLowerCase().includes('name')) {
                    namesFound = true;
                    namesList = [...namesList, ...values];
                }
            });

            // Update specialized Name Source if applicable
            if (namesFound) {
                setNameSource('custom');
                // Merge or replace? User likely wants to replace with AI data
                setCustomNamesRaw(namesList.join(', '));
            }

            setCustomResponses(newResponses);
            setParsingError(null);
            alert("✅ AI Data injected successfully! Correct names and field data have been applied.");
        } catch (e: any) {
            setParsingError(`⚠️ ${e.message}`);
        }
    };

    const reset = () => {
        setStep(1);
        setUrl('');
        setAnalysis(null);
        setError(null);
        setAutomationLogs([]);
        setShowAdminDashboard(false);
        setVisualTokenOverride(null);
    };

    // REMOVED BLOCKING LOGIN CHECK
    /* if (!user) { ... } */

    if (!isSiteUnlocked) {
        const handleUnlock = () => {
            if (accessKeyInput === 'root-access') {
                localStorage.setItem('NAAGRAAZ_ACCESS_KEY', 'root-access');
                setIsSiteUnlocked(true);
            } else {
                setAccessKeyInput('');
            }
        };
        return (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505] px-4 overflow-hidden font-mono">
                {/* Mr. Robot Styled Terminal Background */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Geometric Subtle Red Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(239,68,68,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.15)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_40%,transparent_100%)] opacity-80" />

                    {/* Scanning Laser Line */}
                    <div
                        className="w-full h-[30%] bg-gradient-to-b from-transparent via-red-900/20 to-transparent opacity-100 absolute left-0 right-0 top-0"
                        style={{ animation: 'scanline 4s linear infinite' }}
                    />
                    <style>{`
                        @keyframes scanline {
                            0% { transform: translateY(-100%); }
                            100% { transform: translateY(400%); }
                        }
                    `}</style>
                </div>

                <div className="relative w-full max-w-sm bg-[#0a0a0a]/90 backdrop-blur-xl border border-red-500/20 p-8 rounded-2xl shadow-xl shadow-red-900/10 z-10">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            <ShieldAlert className="w-5 h-5 text-red-500 relative z-10" />
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8 space-y-2">
                        <h1 className="text-2xl font-semibold text-white tracking-tight">Access Denied</h1>
                        <p className="text-sm text-slate-400 font-sans">
                            Public access has been permanently disabled for ethical reasons.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div className="relative">
                            <label htmlFor="accessKey" className="sr-only">Access Key</label>
                            <input
                                id="accessKey"
                                type="password"
                                placeholder="Authorization Key"
                                value={accessKeyInput}
                                onChange={(e) => setAccessKeyInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
                                className="w-full bg-[#050505] border border-slate-800 focus:border-red-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 placeholder:text-slate-600 text-sm transition-all text-center tracking-widest relative z-10"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        <button
                            onClick={handleUnlock}
                            className="w-full bg-white hover:bg-slate-200 text-slate-950 font-semibold rounded-lg py-3 text-sm active:scale-[0.98] transition-all duration-200 relative overflow-hidden group uppercase tracking-widest"
                        >
                            <span className="relative z-10">Authorize</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        </button>
                    </div>

                    {/* Footer Credits text shimmer directly over text */}
                    <div className="mt-8 pt-6 border-t border-slate-800/50 text-center space-y-1.5 flex flex-col items-center">
                        <p className="text-xs font-bold tracking-widest uppercase text-transparent bg-clip-text bg-[linear-gradient(90deg,#64748b,white,#64748b)] bg-[length:200%_auto] animate-[text-shimmer_3s_linear_infinite]">
                            Built by Black Lotus
                        </p>
                        <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
                            Bharamratri Studios
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pt-16 relative overflow-hidden">
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
            {showTokenRequest && user && (
                <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-700/50 p-6 rounded-2xl shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-2">Request Tokens</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            You have run out of tokens. You can request up to 200 tokens from the administrator. Only one active request is allowed at a time.
                        </p>

                        <div className="space-y-4">
                            {tokenRequestStatus === 'checking' ? (
                                <div className="py-8 flex flex-col items-center justify-center">
                                    <Activity className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                                    <p className="text-sm text-slate-400 font-mono">Checking system records...</p>
                                </div>
                            ) : tokenRequestStatus === 'pending_exists' ? (
                                <div className="py-6 flex flex-col items-center text-center bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                    <Clock className="w-10 h-10 text-amber-500 mb-3" />
                                    <h4 className="text-amber-400 font-bold mb-1 tracking-wide">REQUEST PENDING</h4>
                                    <p className="text-sm text-amber-500/80 leading-relaxed font-medium">
                                        {tokenRequestMessage}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            Number of Tokens
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="200"
                                            value={tokenRequestAmount}
                                            onChange={(e) => setTokenRequestAmount(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none font-mono"
                                            disabled={tokenRequestStatus === 'submitting' || tokenRequestStatus === 'success'}
                                        />
                                    </div>

                                    {tokenRequestStatus === 'error' && (
                                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-red-400">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <p className="text-sm font-medium">{tokenRequestMessage}</p>
                                        </div>
                                    )}
                                    {tokenRequestStatus === 'success' && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2 text-emerald-400">
                                            <CheckCircle className="w-4 h-4 shrink-0" />
                                            <p className="text-sm font-medium">{tokenRequestMessage}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowTokenRequest(false);
                                        setTokenRequestStatus('idle');
                                        setTokenRequestMessage('');
                                    }}
                                    className="flex-1 px-4 py-3 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                                    disabled={tokenRequestStatus === 'submitting'}
                                >
                                    Close
                                </button>
                                {tokenRequestStatus !== 'pending_exists' && tokenRequestStatus !== 'checking' && (
                                    <button
                                        onClick={handleTokenRequest}
                                        className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        disabled={tokenRequestStatus === 'submitting' || tokenRequestStatus === 'success'}
                                    >
                                        {tokenRequestStatus === 'submitting' ? (
                                            <>
                                                <Activity className="w-4 h-4 animate-spin" />
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Command className="w-4 h-4" />
                                                <span>Send Request</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <VideoModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} />
            {showRecommendationModal && (
                <RecommendationModal
                    onClose={() => setShowRecommendationModal(false)}
                    onSelect={(val) => {
                        checkBalanceAndRedirect(val);
                        setTargetCount(val);
                    }}
                />
            )}

            <PremiumBackground />

            {/* Floating Header */}

            {/* Premium Atmospheric Verification Sequence */}
            {isLaunching && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
                    <style>{`
                        @keyframes core-inhale {
                            0% { opacity: 0; scale: 0.95; filter: blur(10px); }
                            100% { opacity: 1; scale: 1; filter: blur(0px); }
                        }
                        @keyframes core-drift {
                            0% { transform: translateY(0) scale(1.02); }
                            50% { transform: translateY(-5px) scale(1); }
                            100% { transform: translateY(0) scale(1.02); }
                        }
                        @keyframes zen-pulse {
                            0% { scale: 0.98; opacity: 0.8; }
                            50% { scale: 1.02; opacity: 1; }
                            100% { scale: 0.98; opacity: 0.8; }
                        }
                        @keyframes orbit-slow {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        .zen-glass {
                            background: rgba(2, 6, 23, 0.85);
                            backdrop-filter: blur(40px) saturate(200%);
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.9);
                        }
                        .zen-glass::before {
                            content: '';
                            position: absolute;
                            inset: 0;
                            border-radius: inherit;
                            padding: 1px;
                            background: linear-gradient(180deg, rgba(255,255,255,0.15), transparent, rgba(255,255,255,0.08));
                            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                            -webkit-mask-composite: xor;
                            mask-composite: exclude;
                            pointer-events: none;
                        }
                        .data-pixel {
                            width: 1px;
                            height: 1px;
                            background: rgba(16, 185, 129, 0.4);
                            position: absolute;
                        }
                        .subtle-noise {
                            position: absolute;
                            inset: 0;
                            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                            opacity: 0.03;
                            pointer-events: none;
                        }
                    `}</style>

                    {/* DARK BACKDROP OVERLAY */}
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-0 animate-[core-inhale_0.4s_ease-out_forwards]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,23,0.8)_100%)] z-[1]" />

                    {/* ZEN MINIMALIST HUB */}
                    <div className="relative z-10 w-full max-w-sm mx-auto p-6 md:p-8 animate-[core-inhale_0.5s_ease-out_forwards]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)] animate-pulse" />

                        <div className="zen-glass rounded-[2rem] p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="subtle-noise" />

                            {/* Central Progress Core */}
                            <div className="relative w-32 h-32 md:w-40 md:h-40 mb-10 flex items-center justify-center">
                                {/* Rotating Orbit Rings */}
                                <div className="absolute inset-0 border border-white/[0.03] rounded-full" />
                                <div className="absolute inset-2 border border-dashed border-emerald-500/20 rounded-full animate-[orbit-slow_15s_linear_infinite]" />
                                <div className="absolute inset-4 border border-white/[0.05] rounded-full" />

                                {/* Circular SVG Progress */}
                                <svg className="w-full h-full -rotate-90 relative z-10">
                                    <circle
                                        cx="50%" cy="50%" r="48%"
                                        className="fill-none stroke-white/[0.03] stroke-[1px]"
                                    />
                                    <circle
                                        cx="50%" cy="50%" r="48%"
                                        className="fill-none stroke-emerald-500/60 stroke-[2px] transition-all duration-700"
                                        strokeDasharray="100 100"
                                        strokeDashoffset={100 - launchProgress}
                                        strokeLinecap="round"
                                    />
                                </svg>

                                {/* Inner Pulse */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl md:text-4xl font-light tracking-tighter text-white/90">
                                        {launchProgress}<span className="text-xs opacity-40 ml-0.5">%</span>
                                    </span>
                                    <span className="text-[7px] font-mono text-emerald-500/50 uppercase tracking-[0.4em] mt-1 animate-pulse">
                                        Syncing
                                    </span>
                                </div>
                            </div>

                            {/* Minimal Content */}
                            <div className="space-y-6 w-full relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-sm md:text-base font-medium tracking-[0.2em] text-white/90 uppercase opacity-80">
                                        Mission Sequence
                                    </h2>
                                    <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest italic">
                                        {currentLaunchStage}
                                    </p>
                                </div>

                                {/* Clean Stage Indicator */}
                                <div className="flex justify-center gap-3">
                                    {LAUNCH_STAGES.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx <= activeLaunchStageIndex
                                                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                                : 'bg-white/10'
                                                } ${idx === activeLaunchStageIndex ? 'animate-pulse scale-125' : ''}`}
                                        />
                                    ))}
                                </div>

                                {/* Activity Feed - Ultra Minimal */}
                                <div className="pt-4 border-t border-white/5 space-y-2">
                                    {LAUNCH_ACTIVITIES.slice(activeLaunchStageIndex, activeLaunchStageIndex + 2).map((activity, idx) => (
                                        <div key={activity} className={`flex items-center justify-between text-[8px] font-mono uppercase tracking-widest ${idx === 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                                            <span className="truncate">{activity}</span>
                                            <span className={idx === 0 ? 'animate-pulse' : ''}>
                                                {idx === 0 ? 'Active' : 'Queued'}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Button - PREMIUM */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => void continueLaunchNow()}
                                        className="w-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl py-3 text-[10px] tracking-[0.3em] font-medium uppercase text-white/60 transition-all duration-300 hover:text-white hover:border-white/20"
                                    >
                                        Proceed Mission • Enter
                                    </button>
                                    <p className="text-[7px] text-white/20 uppercase tracking-widest mt-4">
                                        System Ver 4.2.0 • Zen Core
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <Header
                reset={reset}
                step={step}
                version={VERSION}
                user={visualTokenOverride !== null ? (user ? { ...user, tokens: visualTokenOverride } : user) : user}
                loading={authLoading}
                onLogout={handleLogout}
                onShowPricing={() => setShowTokenRequest(true)}
                onSignInClick={() => setShowLogin(true)}
                onDashboardClick={() => setShowAdminDashboard(true)}
            />

            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20 pb-12 px-2 sm:px-6">
                {loading ? (
                    <LoadingScreen
                        progress={aiProgress || loadingMessages[Math.min(Math.floor(progress / 20), loadingMessages.length - 1)]}
                        percentage={progress}
                    />
                ) : (
                    <>
                        {legalType ? (
                            <LegalPage type={legalType} onBack={() => handleLegalNav(null)} />
                        ) : showAdminDashboard && user?.isAdmin ? (
                            <AdminDashboard user={user} onBack={() => setShowAdminDashboard(false)} />
                        ) : (
                            <>
                                {/* STEP 1: INPUT */}
                                {step === 1 && (
                                    <HeroSection
                                        url={url}
                                        setUrl={setUrl}
                                        onAnalyze={handleAnalyze}
                                        onWatchDemo={() => setShowVideoModal(true)}
                                        loading={loading}
                                        version={VERSION}
                                        user={user}
                                        onShowPricing={() => setShowTokenRequest(true)}
                                    />
                                )}

                                {/* STEP 2: CONFIGURATION */}
                                {step === 2 && analysis && (
                                    <Step2Dashboard
                                        analysis={analysis}
                                        setAnalysis={setAnalysis}
                                        user={user}
                                        targetCount={targetCount}
                                        setTargetCount={setTargetCount}
                                        speedMode={speedMode}
                                        setSpeedMode={setSpeedMode}
                                        delayMin={delayMin}
                                        setDelayMin={setDelayMin}
                                        nameSource={nameSource}
                                        setNameSource={setNameSource}
                                        customNamesRaw={customNamesRaw}
                                        setCustomNamesRaw={setCustomNamesRaw}
                                        customResponses={customResponses}
                                        setCustomResponses={setCustomResponses}
                                        aiPromptData={aiPromptData}
                                        setAiPromptData={setAiPromptData}
                                        parsingError={parsingError}
                                        setParsingError={setParsingError}
                                        handleCompile={handleCompile}
                                        handleAIInject={handleAIInject}
                                        reset={reset}
                                        setShowPricing={setShowTokenRequest}
                                        setShowRecommendationModal={setShowRecommendationModal}
                                        checkBalanceAndRedirect={checkBalanceAndRedirect}
                                        isLaunching={isLaunching}
                                        error={error || null}
                                    />
                                )}

                                {/* STEP 3: MISSION CONTROL */}
                                {step === 3 && analysis && (
                                    <section className="w-full flex-1 flex flex-col items-center justify-center py-10">
                                        <MissionControl
                                            logs={automationLogs}
                                            targetCount={targetCount}
                                            initialTokens={user?.tokens || 0}
                                            formTitle={analysis?.title || 'Form Analysis Result'}
                                            onAbort={handleAbort}
                                            onTokenUpdate={setVisualTokenOverride}
                                            onBackToConfig={() => {
                                                setVisualTokenOverride(null);
                                                setAutomationLogs([]);
                                                setStep(2);
                                            }}
                                            onNewMission={reset}
                                        />
                                        <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={reset}
                                                className="text-[10px] text-slate-500 hover:text-white transition-colors flex items-center gap-2 mx-auto uppercase tracking-widest font-bold group"
                                            >
                                                <RotateCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" />
                                                Initialize New Sequence
                                            </button>
                                        </div>
                                    </section>
                                )}
                            </>
                        )}
                    </>
                )}
            </main>

            {!loading && <Footer onLegalNav={handleLegalNav} />}
        </div >
    );
}

export default App;
