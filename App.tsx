import React, { useState, useEffect } from 'react';

// Log Version for Vercel Verification
console.log('🚀 AutoForm AI v0.1.0 Loaded [Razorpay Fixes Included]');
import { Bot, Copy, CheckCircle, AlertCircle, BarChart3, ArrowRight, ArrowLeft, RotateCcw, Sparkles, Code2, Terminal, Zap, Command, Activity, Cpu, Crown, LogOut, Settings, Lock, Laptop, Monitor, Target } from 'lucide-react';
import { fetchAndParseForm } from './services/formParser';
import { analyzeForm as analyzeFormWithStatistics, generateResponseSuggestions } from './services/analysisService';
import { generateAutomationScript } from './utils/scriptTemplate';
import { generateIndianNames } from './utils/indianNames';
import { generateAIPrompt, parseAIResponse } from './utils/parsingUtils';
import { signInWithGoogle, logout, subscribeToUserProfile, incrementUsageCount, trackAuthState } from './services/authService';
import { generateScriptToken, checkRateLimit, getTokenExpirationHours, TokenMetadata } from './services/securityService';
import { FormAnalysis, User } from './types';

import PaymentModal from './components/PaymentModal';
import LoadingScreen from './components/LoadingScreen';
import AdminDashboard from './pages/AdminDashboard';
import TransitionOverlay from './components/TransitionOverlay';
import HeroSection from './components/HeroSection';
import VideoModal from './components/VideoModal';

// --- VISUAL COMPONENTS ---

const Background = () => (
  <>
    <div className="bg-mesh-gradient" />
    <div className="bg-grid-pattern opacity-40" />
    <div className="bg-vignette" />
    <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-black/20 via-transparent to-black/40 pointer-events-none z-0" />
  </>
);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in-up">
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

const LaptopRequirementModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in-up">
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
    <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-amber-500/20 shadow-[0_0_100px_rgba(251,191,36,0.1)] relative z-10">
      <div className="flex flex-col items-center text-center space-y-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20 shadow-lg">
          <Laptop className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h3 className="text-2xl font-serif font-bold text-white mb-3">Desktop or Laptop Required</h3>
          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-xs mx-auto">
            This professional automation suite is designed for computers. Please open this on your <strong>Laptop or PC</strong> for the full experience.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full gold-button py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg"
        >
          I Understand
        </button>
      </div>
    </div>
  </div>
);

// --- APP COMPONENTS ---

const Header = ({ reset, step, user, loading, onLogout, onShowPricing, onSignInClick, onDashboardClick }: { reset: () => void, step: number, user: User | null, loading: boolean, onLogout: () => void, onShowPricing: () => void, onSignInClick: () => void, onDashboardClick: () => void }) => (
  <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
    <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
      <div
        className="flex items-center gap-2 sm:gap-3 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
        onClick={reset}
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" />
        </div>
        <div className="flex flex-col justify-center gap-0.5">
          <span className="font-serif font-semibold text-sm sm:text-base text-white tracking-tight leading-none">AutoForm</span>
          <span className="text-[7px] sm:text-[8px] text-slate-400 font-sans tracking-[0.25em] uppercase opacity-70 hidden sm:block">A NaagRaaz Production</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* User Profile / Login Button */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/5">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
            </div>
          ) : user ? (
            <>
              {user.isAdmin && (
                <>
                  {/* Mobile: Icon Button */}
                  <button
                    onClick={onDashboardClick}
                    className="sm:hidden p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                    title="Admin Dashboard"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {/* Desktop: Full Button */}
                  <button
                    onClick={onDashboardClick}
                    className="hidden sm:block mr-3 px-3 py-1.5 rounded-lg bg-slate-800 text-[10px] text-white font-medium hover:bg-slate-700 transition"
                  >
                    Admin Dashboard
                  </button>
                </>
              )}
              <div className="flex flex-col items-end">
                {/* Mobile: Shortened Name */}
                <span className="sm:hidden text-xs font-medium text-white truncate max-w-[80px]" title={user.displayName || user.email}>
                  {(() => {
                    const name = user.displayName || user.email || '';
                    // Show first name only, or first 10 chars
                    const firstName = name.split(' ')[0];
                    return firstName.length > 10 ? firstName.substring(0, 10) + '...' : firstName;
                  })()}
                </span>
                {/* Desktop: Full Name */}
                <span className="hidden sm:block text-xs font-medium text-white">{user.displayName || user.email}</span>

                <button onClick={onShowPricing} className="text-[10px] font-mono uppercase tracking-wide flex items-center gap-1 transition-colors hover:scale-105 active:scale-95">
                  <span className={`${(user.tokens || 0) < 10 ? 'text-red-400 animate-pulse font-bold' : 'text-amber-400'}`}>
                    {user.tokens || 0} TOKENS
                  </span>
                  <span className="bg-amber-500/20 text-amber-500 px-1 rounded flex items-center justify-center">+</span>
                </button>
              </div>
              <div className="relative group cursor-pointer" onClick={onShowPricing}>
                {/* Token Usage Ring */}
                {/* Visualizing token count: < 10 red, < 50 amber, > 50 emerald */}
                {(() => {
                  const tokens = user.tokens || 0;
                  const isLow = tokens < 10;
                  const isMedium = tokens >= 10 && tokens < 50;

                  const ringColor = isLow ? 'from-red-500 via-red-400 to-red-600' :
                    isMedium ? 'from-amber-400 via-amber-200 to-amber-500' :
                      'from-emerald-400 via-emerald-200 to-emerald-500';

                  return (
                    <>
                      <div className={`absolute -inset-[3px] bg-gradient-to-r ${ringColor} rounded-full blur-[2px] opacity-70`}></div>
                      {isLow && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-bounce z-20" />}
                    </>
                  );
                })()}

                {/* Avatar Container */}
                <div className={`relative w-9 h-9 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-700 shadow-lg relative z-10`}>
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onSignInClick}
              className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors border border-white/5"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="w-full py-8 mt-auto border-t border-white/5 relative z-10 bg-[#020617] overflow-hidden">
    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">

      {/* Left: Branding */}
      <div className="flex flex-col items-start gap-1 opacity-60 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] text-slate-300 font-sans tracking-[0.2em]  font-bold">
            AutoForm
          </span>
        </div>
        <span className="text-[9px] text-amber-500/80 font-serif italic tracking-wider pl-4">
          A NaagRaaz Production
        </span>
      </div>

      {/* Right: Links */}
      <div className="flex items-center gap-6 text-[10px] text-slate-500 font-medium tracking-wider uppercase">
        <span className="hover:text-amber-500 transition-colors cursor-pointer">Privacy</span>
        <span className="hover:text-amber-500 transition-colors cursor-pointer">Terms</span>
        <span className="hover:text-amber-500 transition-colors cursor-pointer">Contact</span>
      </div>
    </div>

    {/* Disclaimer */}
    <div className="max-w-4xl mx-auto border-t border-white/5 mt-8 pt-6 px-4 md:px-6 text-center">
      <p className="text-[10px] md:text-xs text-slate-600 leading-relaxed font-mono mb-3">
        <span className="text-amber-600/70 font-bold">⚠️ LEGAL DISCLAIMER:</span> This tool is provided strictly for <span className="text-slate-500 font-semibold">Educational & Research Purposes</span> only.
      </p>
      <p className="text-[9px] md:text-[10px] text-slate-700 leading-relaxed max-w-2xl mx-auto">
        By using this software, you acknowledge that you are solely responsible for compliance with all applicable laws, regulations, and terms of service.
        The developers assume no liability for misuse, unauthorized access, or violations of third-party policies.
        <span className="block mt-2 text-slate-600">Use responsibly and ethically. Always obtain proper authorization before automating form submissions.</span>
      </p>
      <div className="flex justify-center mb-6 opacity-80 mix-blend-screen pointer-events-none select-none">
        <img
          src="/footer-stamp-hq.jpg"
          alt="NaaGraaz Productions"
          className="w-24 h-24 md:w-32 md:h-32 object-contain"
        />
      </div>
      <p className="text-[10px] text-slate-500 tracking-[0.2em] font-medium uppercase font-sans">
        Designed and Developed by <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ef4444] via-[#ffe4e6] to-[#ef4444] bg-[length:200%_auto] animate-text-shimmer drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]">Mr. Harkamal</span>
      </p>
    </div>
  </footer>
);

const LoadingState = ({ messages, progress }: { messages: string[], progress: number }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // Cycle messages every 2000ms (2 seconds) for readability
    const t = setInterval(() => {
      setIdx(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(t);
  }, [messages]);

  // Use the real progress passed via props


  // Use the real progress passed via props


  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full animate-fade-in-up relative z-20">
      <div className="w-full max-w-lg p-0.5 rounded-2xl bg-gradient-to-b from-white/10 to-transparent relative overflow-hidden group">
        <div className="w-full bg-[#030303]/90 backdrop-blur-2xl rounded-[15px] p-8 md:p-10 flex flex-col items-center relative overflow-hidden">

          {/* Tech Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
          {/* Ambient Glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          {/* Center Icon Construction */}
          <div className="relative mb-12 mt-2">
            <div className="relative z-10 w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-xl animate-pulse" />
              <Cpu className="w-12 h-12 text-amber-500 relative z-10 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />

              {/* Spinning Rings */}
              <div className="absolute inset-0 border border-amber-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
              <div className="absolute inset-3 border border-dashed border-amber-500/30 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
            </div>

            {/* Horizontal Scan Line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          </div>

          {/* Text Status */}
          <div className="w-full space-y-6 mb-2 text-center relative z-10">
            {/* Flexible height container for text */}
            <div className="min-h-[2rem] flex flex-col items-center justify-center">
              <div key={idx} className="font-mono text-xs md:text-sm text-amber-50 tracking-[0.15em] uppercase animate-fade-in-up flex items-center justify-center gap-3 text-center whitespace-normal leading-relaxed max-w-full">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                {messages[idx]}
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">System Status</span>
                <span className="text-[10px] font-mono text-amber-500 font-bold tracking-widest">{progress}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-0.5 bg-white/10 relative overflow-visible">
                <div
                  className="absolute left-0 top-0 h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-200 rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] translate-x-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Tech Corners */}
          <div className="absolute top-4 left-4 w-2 h-2 border-l border-t border-white/20" />
          <div className="absolute top-4 right-4 w-2 h-2 border-r border-t border-white/20" />
          <div className="absolute bottom-4 left-4 w-2 h-2 border-l border-b border-white/20" />
          <div className="absolute bottom-4 right-4 w-2 h-2 border-r border-b border-white/20" />

          {/* Side Details */}
          <div className="absolute top-1/2 left-4 text-[8px] font-mono text-white/10 -rotate-90 origin-center tracking-widest hidden md:block">
            SEQ-8X92
          </div>
          <div className="absolute top-1/2 right-4 text-[8px] font-mono text-white/10 rotate-90 origin-center tracking-widest hidden md:block">
            v4.0.0
          </div>

        </div>
      </div>
    </div>
  );
};

function App() {
  // User State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [aiProgress, setAiProgress] = useState<string>('');
  const [showPricing, setShowPricing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLaptopNotice, setShowLaptopNotice] = useState(false);

  useEffect(() => {
    // Check if user is on mobile and hasn't seen the notice before
    const hasSeenNotice = localStorage.getItem('laptop_notice_seen');

    const checkDevice = () => {
      const isMobile = window.innerWidth < 1024; // Show on tablet/mobile
      if (isMobile && !hasSeenNotice) {
        setShowLaptopNotice(true);
        localStorage.setItem('laptop_notice_seen', 'true');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // App State
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // Real progress tracking
  const [generatedNames, setGeneratedNames] = useState<string[]>([]); // Added for Gold Edition
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FormAnalysis | null>(null);
  const [targetCount, setTargetCount] = useState(10);
  const [delayMin, setDelayMin] = useState(300);
  const [nameSource, setNameSource] = useState<'auto' | 'indian' | 'custom'>('auto');
  const [customNamesRaw, setCustomNamesRaw] = useState('');

  // NEW: AI Data Context State
  const [aiPromptData, setAiPromptData] = useState('');
  const [parsingError, setParsingError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [currentToken, setCurrentToken] = useState<TokenMetadata | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);



  const loadingMessages = [
    "Initializing neural parser...",
    "Connecting to Statistical Engine...",
    "Analyzing semantic structure...",
    "Calculating demographic weights...",
    "Generating automation vector..."
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);

    // Limit selection to available tokens
    const availableTokens = user?.tokens || 0;

    if (val > availableTokens) {
      // If they try to select more than they have, cap it
      if (availableTokens === 0) {
        setTargetCount(10); // Default visual, but will trigger paywall on click if 0
        setShowPricing(true);
      } else {
        setTargetCount(availableTokens);
      }
      if (val > availableTokens && availableTokens > 0) {
        // Maybe show a tooltip or toast? For now just cap it.
      }
    } else {
      setTargetCount(val);
    }
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
      setAiProgress('Form loaded successfully ✓');

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

      setAnalysis(statisticalResult);
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

  // ... (handleCopy logic update)
  // ... (handleCopy logic update)
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
      setShowPricing(true);
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


  const handleCompile = async () => {
    if (!user) return;

    // Strict Limit Check
    if (!user.tokens || user.tokens < targetCount) {
      setShowPricing(true);
      return;
    }

    // 1. VALIDATION: Parse AI Data BEFORE anything else
    let aiParsedResponses: Record<string, string[]> = {};
    if (!aiPromptData.trim()) {
      setParsingError("⚠️ AI Data is REQUIRED. Please copy the prompt, get data from ChatGPT, and paste it here.");
      return;
    }

    try {
      if (analysis) {
        aiParsedResponses = parseAIResponse(aiPromptData, analysis.questions);
        setParsingError(null);
      }
    } catch (e: any) {
      setParsingError(`⚠️ ${e.message}`);
      return;
    }

    // 2. MERGE: AI Data into Custom Responses (AI overrides existing if keys match, or we can merge)
    // For now, let's treat AI data as the source of truth for populated fields
    const mergedResponses = { ...customResponses };
    Object.entries(aiParsedResponses).forEach(([qId, values]) => {
      mergedResponses[qId] = values.join(', ');
    });

    // We update the state so handleCopy picks it up
    setCustomResponses(mergedResponses);

    // --- OPTIMIZED TRANSITION FLOW ---
    setIsTransitioning(true);

    setTimeout(async () => {
      try {
        const success = await handleCopy(mergedResponses);

        if (success) {
          setTimeout(() => {
            setStep(3);
            setTimeout(() => {
              setIsTransitioning(false);
            }, 300);
          }, 800);
        } else {
          setIsTransitioning(false);
        }
      } catch (err) {
        setIsTransitioning(false);
        console.error("Compilation failed during transition", err);
      }
    }, 300);
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
    setShowAdminDashboard(false);
  };

  // REMOVED BLOCKING LOGIN CHECK
  /* if (!user) { ... } */

  return (
    <div className="min-h-screen flex flex-col pt-16 relative overflow-hidden">
      <Background />
      {showLaptopNotice && <LaptopRequirementModal onClose={() => setShowLaptopNotice(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
      {showPricing && user && <PaymentModal onClose={() => setShowPricing(false)} user={user} />}
      {isTransitioning && <TransitionOverlay />}
      <VideoModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} />

      <Header
        reset={reset}
        step={step}
        user={user}
        loading={authLoading}
        onLogout={handleLogout}
        onShowPricing={() => setShowPricing(true)}
        onSignInClick={() => setShowLogin(true)}
        onDashboardClick={() => setShowAdminDashboard(true)}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col relative z-10">

        {/* ADMIN DASHBOARD */}
        {showAdminDashboard && user?.isAdmin ? (
          <AdminDashboard user={user} onBack={() => setShowAdminDashboard(false)} />
        ) : (
          <>
            {/* STEP 1: INPUT */}
            {step === 1 && !loading && (
              <HeroSection
                url={url}
                setUrl={setUrl}
                onAnalyze={handleAnalyze}
                onWatchDemo={() => setShowVideoModal(true)}
                loading={loading}
              />
            )}


            {loading && <LoadingState messages={loadingMessages} progress={progress} />}

            {/* STEP 2: DASHBOARD */}
            {
              step === 2 && analysis && (
                <section className="w-full animate-fade-in-up">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-8">
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight">{analysis.title}</h2>
                      <div className="flex gap-3">
                        <Badge color="obsidian">{analysis.questions.length} Fields</Badge>
                        <Badge color="gold">Algorithm Optimized</Badge>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={reset} className="glass-panel px-6 py-3 rounded-lg text-slate-400 text-sm hover:text-white transition">
                        Cancel
                      </button>
                      <button onClick={handleCompile} className="relative overflow-hidden gold-button px-8 py-3 rounded-lg text-sm shadow-[0_0_25px_rgba(251,191,36,0.15)] animate-sheen">
                        <span className="relative z-10">Compile Script</span>
                      </button>
                    </div>
                  </div>

                  {/* Error Banner */}
                  {error && (
                    <div className="mb-6 flex items-center gap-3 text-red-200 bg-red-950/80 border border-red-500/30 px-6 py-4 rounded-xl text-sm font-medium backdrop-blur-xl shadow-xl animate-fade-in-up">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Config */}
                    <div className="space-y-6">
                      <div className="glass-panel p-6 rounded-xl space-y-8">
                        <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                          <Settings className="w-4 h-4 text-amber-500" /> Runtime Config
                        </div>

                        <div className="space-y-4 relative">
                          <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>Response Volume</span>
                            <span className="text-amber-400 font-mono flex items-center gap-1">
                              {targetCount}
                              {!user.isPremium && <Lock className="w-3 h-3 text-slate-500" />}
                            </span>
                          </div>
                          <input
                            type="range" min="1" max={!user.isPremium ? "20" : "200"} // Visual max
                            value={targetCount}
                            onChange={handleSliderChange}
                            className="w-full"
                          />
                          {(!user.isPremium && (user.responsesUsed >= 50 || targetCount === (50 - user.responsesUsed))) && (
                            <div className="text-[10px] text-amber-500/80 mt-1 flex items-center justify-end gap-1 cursor-pointer hover:text-amber-400" onClick={() => setShowPricing(true)}>
                              Free Trial Limit Reached. <span className="underline">Upgrade</span>
                            </div>
                          )}

                          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-200/80 leading-relaxed font-mono">
                            <span className="text-red-400 font-bold block mb-1 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> GOOGLE POLICY WARNING</span>
                            To avoid account suspension, <span className="text-white font-bold">PRO users</span> should not exceed 100 responses/hour per IP.
                            <br />
                            Automated behavior monitoring is active.
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>Interaction Delay</span>
                            <span className="text-amber-400 font-mono">{delayMin}ms</span>
                          </div>
                          <input
                            type="range" min="100" max="2000"
                            value={delayMin} onChange={(e) => setDelayMin(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="glass-panel p-6 rounded-xl border-l-2 border-l-amber-500/50">
                        <div className="flex items-center gap-2 text-sm font-bold text-white mb-4 uppercase tracking-wider">
                          <Bot className="w-4 h-4 text-amber-500" /> AI Insight
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-mono">
                          "{analysis.aiReasoning}"
                        </p>
                      </div>

                      {/* Name Source Selection - Only if 'name' field exists */}
                      {analysis.questions.some(q => q.title.toLowerCase().includes('name')) && (
                        <div className="glass-panel p-6 rounded-xl space-y-4">
                          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider mb-2">
                            <Command className="w-4 h-4 text-amber-500" /> Name Source
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {['auto', 'indian', 'custom'].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setNameSource(opt as any)}
                                className={`text-[10px] font-mono uppercase py-2 rounded border transition-all ${nameSource === opt
                                  ? 'bg-amber-500/20 border-amber-500text-white'
                                  : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                                  } ${nameSource === opt ? 'border-amber-500 text-amber-400' : ''}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {nameSource === 'custom' && (
                            <textarea
                              value={customNamesRaw}
                              onChange={(e) => setCustomNamesRaw(e.target.value)}
                              placeholder="Enter names separated by commas (e.g. John Doe, Jane Smith)"
                              className="w-full bg-[#050505] border border-white/10 rounded-lg p-3 text-xs text-white font-mono h-24 focus:border-amber-500/50 outline-none"
                            />
                          )}
                          {nameSource === 'auto' && <p className="text-[10px] text-slate-500">AI will auto-generate diverse names based on context.</p>}
                          {nameSource === 'indian' && <p className="text-[10px] text-slate-500">Uses a database of authentic Indian first and last names.</p>}
                        </div>
                      )}
                    </div>

                    {/* Right Col: Data Preview */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                      {/* AI DATA INJECTION (REQUIRED) - Now in Right Col */}
                      <div className={`glass-panel p-6 rounded-xl space-y-4 border-l-2 relative overflow-hidden ${parsingError ? 'border-red-500 bg-red-500/5' : 'border-amber-500/50'}`}>
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-amber-500" /> AI Data Injection
                            <span className="text-[10px] text-red-400 bg-red-900/30 px-2 py-0.5 rounded ml-2 border border-red-500/20 shadow-sm">REQUIRED STEP 1</span>
                          </div>

                          <button
                            onClick={() => {
                              const prompt = generateAIPrompt(analysis.title, analysis.description, analysis.questions, targetCount);
                              navigator.clipboard.writeText(prompt);
                              alert("Contextual prompt copied! Paste this into ChatGPT.");
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-mono px-4 py-2 rounded-lg border border-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-amber-500/10"
                          >
                            <Sparkles className="w-3 h-3" /> Copy Contextual Prompt
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                          <div className="space-y-3">
                            <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                              <strong className="text-amber-500 block mb-1 uppercase tracking-tighter text-[10px]">Step 1: Get Data</strong>
                              Copy the contextual prompt to get realistic, targeted data from ChatGPT.
                            </p>
                            <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                              <strong className="text-amber-500 block mb-1 uppercase tracking-tighter text-[10px]">Step 2: Inject</strong>
                              Paste the JSON reply below and click "Inject to Fields" to auto-populate the form.
                            </p>
                            <button
                              onClick={handleAIInject}
                              className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider hover:bg-amber-400 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                              <Activity className="w-4 h-4" /> Inject Data to Fields
                            </button>
                          </div>
                          <div className="relative h-full">
                            <textarea
                              value={aiPromptData}
                              onChange={(e) => {
                                setAiPromptData(e.target.value);
                                if (parsingError) setParsingError(null);
                              }}
                              placeholder='Paste JSON from ChatGPT here...'
                              className={`w-full h-full min-h-[100px] bg-[#050505] border rounded-xl p-3 text-xs text-white font-mono focus:outline-none transition-colors resize-none ${parsingError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-500/50'}`}
                            />
                            {parsingError && (
                              <div className="absolute bottom-2 right-2 text-[10px] text-red-400 font-bold bg-black/80 px-2 py-1 rounded backdrop-blur border border-red-500/30">
                                {parsingError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>



                      {/* DATA PREVIEW / DEMOGRAPHICS */}
                      <div className="glass-panel p-1 rounded-xl flex flex-col h-[500px] border-t border-t-white/10 relative">
                        {/* Tip Banner */}
                        <div className="absolute top-0 inset-x-0 bg-blue-500/10 border-b border-blue-500/10 p-2 flex items-center justify-center gap-2 text-[10px] text-blue-300 font-mono z-20 backdrop-blur-sm">
                          <Activity className="w-3 h-3 text-blue-400" />
                          <span>STEP 2: You can edit any question and fine-tune response behavior here.</span>
                        </div>

                        <div className="px-6 py-4 mt-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Demographic Distribution</span>
                          <BarChart3 className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                          {analysis.questions.map((q, qIdx) => (
                            <div key={q.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                              <div className="flex justify-between items-start mb-4">
                                <span className="text-sm text-slate-200 font-medium max-w-[80%] group-hover:text-white transition-colors">{q.title}</span>
                                <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-500 font-mono">{q.type}</span>
                              </div>

                              {/* Weight Editor */}
                              <div className="space-y-3">
                                {q.options.slice(0, 10).map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-3 text-xs">
                                    <div className="w-12 shrink-0">
                                      <input
                                        type="number"
                                        min="0" max="100"
                                        value={opt.weight || 0}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          const newAnalysis = { ...analysis };
                                          newAnalysis.questions[qIdx].options[oIdx].weight = val;
                                          setAnalysis(newAnalysis);
                                        }}
                                        className="w-full bg-[#020617] border border-white/10 rounded px-1 py-1 text-center font-mono text-amber-500 focus:border-amber-500/50 outline-none"
                                      />
                                    </div>
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-300" style={{ width: `${opt.weight}%` }} />
                                    </div>
                                    <div className="w-32 truncate text-slate-500" title={opt.value}>{opt.value}</div>
                                  </div>
                                ))}

                                {(q.type === 'MULTIPLE_CHOICE' || q.type === 'CHECKBOXES' || q.type === 'DROPDOWN') && (
                                  <div className="flex justify-end pt-2 border-t border-white/5 mt-2">
                                    <span className={`text-[10px] font-mono font-bold ${q.options.reduce((a, b) => a + (b.weight || 0), 0) === 100
                                      ? 'text-emerald-500'
                                      : 'text-red-400'
                                      }`}>
                                      TOTAL: {q.options.reduce((a, b) => a + (b.weight || 0), 0)}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Custom Response Input for Text Fields (Non-Name) */}
                              {(q.type === 'SHORT_ANSWER' || q.type === 'PARAGRAPH') && !q.title.toLowerCase().includes('name') && (
                                <div className="mt-4 pt-3 border-t border-white/5 animate-fade-in">
                                  <label className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-2 block flex items-center gap-2">
                                    <Command className="w-3 h-3" /> Custom Responses (Optional)
                                  </label>
                                  <textarea
                                    className="w-full bg-[#050505] border border-white/10 rounded-lg p-2 text-xs text-white font-mono h-20 focus:border-amber-500/50 outline-none placeholder-slate-600"
                                    placeholder="Enter answers separated by commas (e.g. Yes, No, Maybe, Detailed feedback...)"
                                    value={customResponses[q.id] || ""}
                                    onChange={(e) => setCustomResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                                  />
                                  <p className="text-[9px] text-slate-500 mt-1">If provided, these answers will be cycled/randomized for each response.</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )
            }

            {/* STEP 3: OUTPUT */}
            {
              step === 3 && analysis && (
                <section className="max-w-4xl mx-auto w-full animate-fade-in-up">
                  {/* AUTO-COPY SUCCESS BANNER */}
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-8 flex items-center justify-center gap-3 animate-fade-in-up shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-bold text-sm tracking-wide uppercase">Payload Automatically Copied</p>
                      <p className="text-[10px] text-emerald-500/70 font-mono">Ready for console injection</p>
                    </div>
                  </div>
                  {/* UNLOCKED CODE UI */}
                  <>
                    {/* Back Button */}
                    <div className="w-full mb-6 animate-fade-in-up">
                      <button
                        onClick={() => setStep(2)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 text-slate-400 hover:text-white transition-all group"
                      >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Configuration</span>
                      </button>
                    </div>

                    <div className="text-center mb-10 animate-fade-in-up">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-transparent border border-amber-500/20 mb-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/10 blur-xl"></div>
                        <Terminal className="w-8 h-8 text-amber-500 relative z-10" />
                      </div>
                      <h2 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 mb-3 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Script Generated & Copied</h2>
                      <p className="text-slate-400 max-w-md mx-auto">The automation payload has been copied to your clipboard. Follow the instructions below to execute.</p>

                      {/* Security Status Badge */}
                      {currentToken && (
                        <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <Lock className="w-4 h-4 text-emerald-400" />
                          <div className="text-xs">
                            <span className="text-emerald-400 font-bold">Secured & Authenticated</span>
                            <span className="text-slate-500 mx-2">•</span>
                            <span className="text-slate-400">Expires in {getTokenExpirationHours(currentToken.expiresAt)}h</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detailed Instructions */}
                    <div className="space-y-4 animate-fade-in-up mb-8">
                      {/* Section Divider */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/20">
                          <Terminal className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">How to Execute</span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                      </div>

                      {/* Step 1 */}
                      <div className="glass-panel p-4 md:p-6 rounded-xl border-l-2 border-l-amber-500/50 hover:border-l-amber-500 transition-all">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <span className="text-amber-500 font-bold text-sm">1</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Navigate to Target Form</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                              Open the Google Form URL in your browser. Ensure you're on the form's main page where questions are visible.
                            </p>
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                              <code className="text-[10px] text-emerald-400 font-mono break-all">{url || 'https://docs.google.com/forms/...'}</code>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="glass-panel p-4 md:p-6 rounded-xl border-l-2 border-l-amber-500/50 hover:border-l-amber-500 transition-all">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <span className="text-amber-500 font-bold text-sm">2</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Open Browser Console</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                              Access the Developer Console using one of these methods:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Windows/Linux</div>
                                <div className="text-xs text-white font-mono">F12 or Ctrl+Shift+J</div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">macOS</div>
                                <div className="text-xs text-white font-mono">Cmd+Option+J</div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Menu</div>
                                <div className="text-xs text-white font-mono">⋮ → More Tools → Console</div>
                              </div>
                            </div>
                            <p className="text-[10px] text-amber-500/80 mt-3 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Make sure you're on the "Console" tab, not Elements or Network
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="glass-panel p-4 md:p-6 rounded-xl border-l-4 border-l-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)] transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none"><Copy className="w-24 h-24 text-emerald-500" /></div>
                        <div className="flex items-start gap-3 md:gap-4 relative z-10">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <span className="text-emerald-400 font-bold text-sm">3</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Paste Payload</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                              The script is already in your clipboard. Just paste it into the console.
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Terminal className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Paste using <code className="text-white bg-white/10 px-1 rounded">Ctrl+V</code> (Windows) or <code className="text-white bg-white/10 px-1 rounded">Cmd+V</code> (Mac)</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                <span><strong className="text-amber-400">First time?</strong> Chrome/Edge will ask you to type <code className="text-white bg-white/10 px-1 rounded">allow pasting</code> to enable paste</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Press <code className="text-white bg-white/10 px-1 rounded">Enter</code> to execute</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="glass-panel p-4 md:p-6 rounded-xl border-l-2 border-l-emerald-500/50 hover:border-l-emerald-500 transition-all">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <span className="text-emerald-500 font-bold text-sm">4</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Monitor Execution</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                              The script will automatically fill and submit the form {targetCount} time{targetCount !== 1 ? 's' : ''}. Watch the console for real-time progress.
                            </p>
                            <div className="bg-black/40 rounded-lg p-4 border border-emerald-500/20 overflow-x-auto">
                              <div className="space-y-2 text-[10px] font-mono whitespace-nowrap">
                                <div className="text-emerald-400">✓ Script initialized successfully</div>
                                <div className="text-blue-400">→ Filling response 1/{targetCount}...</div>
                                <div className="text-amber-400">⟳ Submitting form...</div>
                                <div className="text-emerald-400">✓ Response 1 submitted</div>
                                <div className="text-slate-500">...</div>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-3">
                              Do not close the tab or navigate away until all responses are submitted.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Warning Box */}
                      <div className="glass-panel p-5 rounded-xl bg-red-500/5 border border-red-500/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-wide">Important Notes</h4>
                            <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                              <li className="flex items-start gap-2">
                                <span className="text-red-500 shrink-0">•</span>
                                <span className="font-bold text-amber-500">CRITICAL: KEEP THIS WINDOW OPEN & ACTIVE</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-500 shrink-0">•</span>
                                <span>Do not minimize the browser or switch tabs, or the script may pause</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-500 shrink-0">•</span>
                                <span>Do not interact with the form manually while the script is running</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-500 shrink-0">•</span>
                                <span>If errors occur, check the console for detailed error messages</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel rounded-xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.1)] mb-8 border border-emerald-500/30 animate-fade-in-up bg-[#020617]/50 relative ring-1 ring-emerald-500/20">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center relative z-10">

                        {/* Success Icon Animation */}
                        <div className="relative mb-8 group cursor-pointer" onClick={handleCopy}>
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:scale-105 transition-transform duration-500">
                            <CheckCircle className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          </div>

                          {/* Orbiting particles */}
                          <div className="absolute inset-0 border border-emerald-500/10 rounded-full animate-[spin_4s_linear_infinite]" />
                          <div className="absolute inset-[-10px] border border-dashed border-emerald-500/10 rounded-full animate-[spin_10s_linear_infinite_reverse]" />
                        </div>

                        <h3 className="text-2xl font-serif font-bold text-white mb-2">Payload Ready & Copied</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8 font-mono">
                          The secure script has been automatically copied to your clipboard.
                          <br />
                          <span className="text-emerald-500/80 text-xs">Ready for injection</span>
                        </p>

                        {/* Primary Action Button */}
                        <button
                          onClick={handleCopy}
                          className={`group relative overflow-hidden px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-xl ${copied
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                            : 'bg-gradient-to-br from-amber-400 to-amber-600 text-black border border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.2)]'
                            }`}
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                          <span className="relative z-10 flex items-center gap-3">
                            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? 'Copied Successfully' : 'Copy Payload Again'}
                          </span>
                        </button>

                        <div className="mt-8 flex items-center gap-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Memory Safe
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-amber-500/60">Obfuscated</span>
                          </span>
                        </div>

                      </div>
                    </div>


                    <div className="text-center mt-12 animate-fade-in-up">
                      <button onClick={reset} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-2 mx-auto uppercase tracking-widest font-bold group">
                        <RotateCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" /> Initialize New Sequence
                      </button>
                    </div>
                  </>

                </section>
              )
            }
          </>
        )
        }
      </main >

      <Footer />
    </div >
  );
}

export default App;