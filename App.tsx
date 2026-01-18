import React, { useState, useEffect } from 'react';

// Log Version for Vercel Verification
console.log('[SYSTEM] AutoForm AI v0.1.0 Loaded [Razorpay Fixes Included]');
import { Bot, Copy, CheckCircle, AlertCircle, BarChart3, ArrowRight, ArrowLeft, RotateCcw, Sparkles, Code2, Terminal, Zap, Command, Activity, Cpu, Crown, LogOut, Settings, Lock, Laptop, Monitor, Target, ShieldCheck, ExternalLink } from 'lucide-react';
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
import MissionControl from './components/MissionControl';
import Header from './components/Header';
import PremiumBackground from './components/PremiumBackground';
import MatrixReveal from './components/MatrixReveal'; // Imported MatrixReveal

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

const RecommendationModal = ({ onClose, onSelect }: { onClose: () => void, onSelect: (val: number) => void }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
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


const Footer = () => (
  <footer className="w-full py-12 mt-auto border-t border-white/5 relative z-10 bg-black overflow-hidden mb-20 md:mb-0">
    <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center relative z-10">

      {/* Main Branding - Centered & Prestigious */}
      <div className="flex flex-col items-center gap-4 mb-8 group cursor-default">
        <div className="relative">
          <div className="absolute -inset-4 bg-amber-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-xs text-slate-300 font-sans tracking-[0.3em] font-bold uppercase transition-colors group-hover:text-white">
              AutoForm . AI
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
          </div>
        </div>

        <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-amber-500/50 transition-all duration-700" />

        <span className="text-xs md:text-sm text-amber-500/90 font-serif italic tracking-widest hover:text-amber-400 transition-colors">
          A Naagraaz Production
        </span>
      </div>

      {/* Links - Minimalist */}
      <div className="flex items-center gap-8 text-[9px] text-slate-600 font-medium tracking-widest uppercase mb-8">
        <span className="hover:text-white transition-colors cursor-pointer hover:underline underline-offset-4 decoration-amber-500/50">Privacy Protocol</span>
        <span className="hover:text-white transition-colors cursor-pointer hover:underline underline-offset-4 decoration-amber-500/50">Service Terms</span>
        <a href="mailto:NAAGRAAZPRODUCTION@GMAIL.COM" className="hover:text-white transition-colors cursor-pointer hover:underline underline-offset-4 decoration-amber-500/50">Support Channel</a>
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
              Naagraaz Productions assumes no liability for the operational misuse or unauthorized application of this system.
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
          <div className="absolute -inset-8 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Signature Text */}
          <MatrixReveal
            text="MR. HARKAMAL"
            className="relative z-10 text-lg md:text-xl font-bold liquid-gold-text drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
          />
        </div>
      </div>




    </div>
  </footer>
);

// DELETED: LoadingState replaced by LoadingScreen component

function App() {
  // User State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [aiProgress, setAiProgress] = useState<string>('');
  const [showPricing, setShowPricing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  // REMOVED EXTENSION DETECTION - NOW USING SYSTEM NATIVE ENGINE
  const isExtensionInstalled = false; // Forced false to bypass logic
  const [stopAutomation, setStopAutomation] = useState(false);


  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);

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
  const [questionSearch, setQuestionSearch] = useState('');

  // AUTOMATION STATE
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);

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

  const checkBalanceAndRedirect = (val: number) => {
    if (user && val > (user.tokens || 0)) {
      setError("Token Limit Exceeded: Insufficient balance. Redirecting to upgrades...");
      setTimeout(() => {
        setShowPricing(true);
      }, 1500);
      return true;
    }
    return false;
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

  const executeNativeSubmission = async (url: string, data: Record<string, string | string[]>) => {
    return new Promise((resolve) => {
      const iframeName = `af_bridge_${Math.random().toString(36).substring(7)}`;
      const iframe = document.createElement('iframe');
      iframe.name = iframeName;
      iframe.id = iframeName;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url.split('?')[0].replace(/\/viewform$/, '/formResponse'); // Action URL
      form.target = iframeName;

      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `entry.${key}`;
            input.value = v;
            form.appendChild(input);
          });
        } else {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = `entry.${key}`;
          input.value = value as string;
          form.appendChild(input);
        }
      });

      // Add page history to ensure submission works for multi-page forms
      const hist = document.createElement('input');
      hist.type = 'hidden';
      hist.name = 'pageHistory';
      hist.value = '0';
      form.appendChild(hist);

      document.body.appendChild(form);

      try {
        form.submit();
      } catch (e) {
        console.error("Native Submission Error:", e);
      }

      // Cleanup
      setTimeout(() => {
        if (document.body.contains(form)) document.body.removeChild(form);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        resolve(true);
      }, 2000);
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
      setShowPricing(true);
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

      pushLog(`Handshake verified. Establishing secure neural link...`);
      await new Promise(r => setTimeout(r, 2000)); // Immersion delay

      for (let i = 0; i < targetCount; i++) {
        // Check for Abort
        if ((window as any).__AF_STOP_SIGNAL) break;

        pushLog(`Response #${i + 1}: Simulating human reasoning...`);
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000)); // Thinking delay

        pushLog(`Response #${i + 1}: Generating optimized payload...`);

        // Generate values for this specific submission
        const submissionData: Record<string, string | string[]> = {};

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
          // 3. Random fallback for options
          else if (q.options.length > 0) {
            const picker = (options: any[]) => {
              const total = options.reduce((acc, opt) => acc + (opt.weight || 0), 0);
              if (total === 0) return options[Math.floor(Math.random() * options.length)].value;
              let r = Math.random() * total;
              for (const opt of options) {
                if (r < (opt.weight || 0)) return opt.value;
                r -= (opt.weight || 0);
              }
              return options[0].value;
            };

            if (q.type === 'CHECKBOXES') {
              value = [picker(q.options)];
            } else {
              value = picker(q.options);
            }
          }

          if (value) submissionData[q.entryId] = value;
        });

        pushLog(`Response #${i + 1}: Relaying to secure endpoint...`);
        await executeNativeSubmission(url, submissionData);

        successCount++;

        // --- ADAPTIVE COOLDOWN (Safety Fix) ---
        // Every 15 submissions, add a "System Cooldown" to bypass IP-based rate limiting
        if (successCount % 15 === 0 && successCount < targetCount) {
          const cooldownSecs = 30 + Math.floor(Math.random() * 30);
          pushLog(`IP SAFETY: Automatic cooldown triggered. Waiting ${cooldownSecs}s to prevent blocking...`, 'COOLDOWN');
          await new Promise(r => setTimeout(r, cooldownSecs * 1000));
        } else {
          // Natural Human-scale Jitter/Delay
          const jitter = Math.floor(Math.random() * 4000) + 2000;
          await new Promise(r => setTimeout(r, jitter));
        }

        pushLog(`Response #${i + 1}: Submission recorded.`, 'RUNNING', successCount);
      }

      if (!(window as any).__AF_STOP_SIGNAL) {
        pushLog('SEQUENCER COMPLETE. All background jobs finished.', 'DONE', targetCount);
      } else {
        pushLog('MISSION PARTIALLY COMPLETED. Intercepted by user.', 'ABORTED', successCount);
      }

      // ACCURATE TOKEN DEDUCTION: Only deduct what was actually sent
      if (successCount > 0) {
        await incrementUsageCount(user.uid, successCount);
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
    if (!user.tokens || user.tokens < targetCount) {
      setShowPricing(true);
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

    // --- OPTIMIZED TRANSITION FLOW ---
    setIsTransitioning(true);

    setTimeout(async () => {
      setStep(3);
      setIsTransitioning(false);

      try {
        await handleAutoRun(mergedResponses);
      } catch (err) {
        console.error("Auto-Run failed", err);
      }
    }, 1200);
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
  };

  // REMOVED BLOCKING LOGIN CHECK
  /* if (!user) { ... } */

  return (
    <div className="min-h-screen flex flex-col pt-16 relative overflow-hidden">
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
      {showPricing && user && <PaymentModal onClose={() => setShowPricing(false)} user={user} />}
      {isTransitioning && <TransitionOverlay />}
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
      <Header
        reset={() => {
          setStep(1);
          setAnalysis(null);
          setUrl('');
          setParsingError(null);
        }}
        step={step}
        user={user}
        loading={authLoading}
        onLogout={handleLogout}
        onShowPricing={() => setShowPricing(true)}
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
            {showAdminDashboard && user?.isAdmin ? (
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
                    user={user}
                    onShowPricing={() => setShowPricing(true)}
                  />
                )}

                {/* STEP 2: DASHBOARD */}
                {step === 2 && analysis && (
                  <section className="w-full animate-fade-in-up">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-8">
                      <div>
                        <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight">{analysis.title}</h2>
                        <div className="flex gap-3">
                          <Badge color="obsidian">{analysis.questions.length} Fields</Badge>
                          <Badge color="gold">Algorithm Optimized</Badge>
                          {user && (user.tokens || 0) < targetCount && (
                            <button
                              onClick={() => setShowPricing(true)}
                              className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse ml-1"
                            >
                              <Crown className="w-3 h-3" />
                              Low on tokens? Refill
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-3">
                          <button onClick={reset} className="glass-panel px-6 py-3 rounded-lg text-slate-400 text-sm hover:text-white transition">
                            Cancel
                          </button>
                          <button
                            onClick={handleCompile}
                            className="relative overflow-hidden gold-button px-8 py-3 rounded-lg text-sm shadow-[0_0_25px_rgba(251,191,36,0.15)] animate-sheen"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Launch Mission Control
                            </span>
                          </button>
                        </div>
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest opacity-70">
                          Finalize configuration then launch process
                        </span>
                      </div>
                    </div>

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

                          <div className="mt-4 mb-4">
                            <label className="block text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-emerald-500" />
                                Number of Responses to Generate
                              </span>
                              <button
                                onClick={() => setShowRecommendationModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Academic Guide</span>
                              </button>
                            </label>

                            <div className="flex flex-col gap-6">
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => setTargetCount(Math.max(1, (targetCount || 0) - 10))}
                                  className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-2xl transition-all active:scale-90 border border-slate-700"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={200}
                                  value={isNaN(targetCount) ? '' : targetCount}
                                  onChange={(e) => {
                                    if (e.target.value === '') {
                                      setTargetCount(NaN);
                                      return;
                                    }
                                    const val = Math.min(Number(e.target.value), 200);
                                    checkBalanceAndRedirect(val);
                                    setTargetCount(val);
                                  }}
                                  className="flex-1 h-14 bg-slate-900/50 border-2 border-slate-700 rounded-2xl text-center text-amber-400 font-mono font-bold text-2xl focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                                />
                                <button
                                  onClick={() => {
                                    const newVal = Math.min(200, (targetCount || 0) + 10);
                                    checkBalanceAndRedirect(newVal);
                                    setTargetCount(newVal);
                                  }}
                                  className="w-14 h-14 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 flex items-center justify-center font-bold text-2xl transition-all active:scale-90 border border-amber-500/30"
                                >
                                  +
                                </button>
                              </div>

                              <div className="grid grid-cols-5 gap-2">
                                {[10, 25, 50, 100, 200].map((preset) => (
                                  <button
                                    key={preset}
                                    onClick={() => {
                                      checkBalanceAndRedirect(preset);
                                      setTargetCount(preset);
                                    }}
                                    className={`py-3 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 border ${targetCount === preset
                                      ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white border-slate-700'
                                      }`}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {user && targetCount > (user.tokens || 0) && (
                              <div className="mt-4 bg-red-900/40 text-red-200 text-xs px-4 py-3 rounded-xl border border-red-500/30 animate-fade-in flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  Insufficient Tokens (Current: {user.tokens})
                                </span>
                                <button
                                  onClick={() => setShowPricing(true)}
                                  className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-red-400 transition-colors"
                                >
                                  Upgrade
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-200/80 leading-relaxed font-mono">
                            <span className="text-red-400 font-bold block mb-1 flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3" />
                              SYSTEM SECURITY PROTOCOL
                            </span>
                            To maintain account integrity, avoid exceeding 100 responses per hour per IP address.
                          </div>
                        </div>

                        <div className="glass-panel p-6 rounded-xl space-y-4">
                          <div className="flex justify-between text-xs font-bold text-white uppercase tracking-widest">
                            <span>Interaction Delay</span>
                            <span className="text-amber-400 font-mono">{delayMin}ms</span>
                          </div>
                          <input
                            type="range" min="100" max="2000"
                            value={delayMin}
                            onChange={(e) => setDelayMin(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      </div>

                      {/* Right Col: Operations */}
                      <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Name Source Selection */}
                        {analysis.questions.some(q => q.title.toLowerCase().includes('name')) && (
                          <div className="glass-panel p-6 rounded-xl space-y-4 border-l-2 border-l-amber-500/50 bg-amber-500/[0.02]">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                <Command className="w-4 h-4 text-amber-500" /> Identity Generator Configuration
                              </div>
                              <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded">REQUIRED CONFIGURATION</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { id: 'auto', label: 'AI Auto', desc: 'Contextual selection' },
                                { id: 'indian', label: 'Indian DB', desc: 'Regional names' },
                                { id: 'custom', label: 'Manual List', desc: 'User specified' }
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => setNameSource(opt.id as any)}
                                  className={`text-[10px] font-mono group relative overflow-hidden flex flex-col items-center py-4 rounded-xl border transition-all ${nameSource === opt.id
                                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                                    : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                >
                                  {nameSource === opt.id && <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500" />}
                                  <span className="font-bold tracking-widest uppercase mb-1">{opt.label}</span>
                                  <span className="opacity-50 text-[8px] tracking-tight">{opt.desc}</span>
                                </button>
                              ))}
                            </div>

                            {nameSource === 'custom' && (
                              <textarea
                                value={customNamesRaw}
                                onChange={(e) => setCustomNamesRaw(e.target.value)}
                                placeholder="Enter names separated by commas..."
                                className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-xs text-white font-mono h-24 focus:border-amber-500/50 outline-none shadow-inner"
                              />
                            )}
                          </div>
                        )}

                        {/* AI DATA INJECTION */}
                        {(() => {
                          const relevantTextFields = analysis.questions.filter(q =>
                            (q.type === 'SHORT_ANSWER' || q.type === 'PARAGRAPH') &&
                            !q.title.toLowerCase().includes('name')
                          );

                          if (relevantTextFields.length === 0) return null;

                          const isRequired = relevantTextFields.some(q => q.required);

                          return (
                            <div className={`glass-panel p-6 rounded-xl space-y-4 border-l-2 relative overflow-hidden ${parsingError ? 'border-red-500 bg-red-500/5' : isRequired ? 'border-amber-500/50' : 'border-emerald-500/50'}`}>
                              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                  <Sparkles className="w-4 h-4 text-emerald-500" /> AI Data Injection
                                  {isRequired ? (
                                    <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded ml-2 border border-amber-500/20 shadow-sm animate-pulse">REQUIRED CONFIGURATION</span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded ml-2 border border-emerald-500/20 shadow-sm opacity-80">OPTIONAL CONFIGURATION</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    const prompt = generateAIPrompt(analysis.title, analysis.description, analysis.questions, targetCount);
                                    navigator.clipboard.writeText(prompt);
                                    window.open('https://chatgpt.com', '_blank');
                                    alert("System: Prompt copied to clipboard. Redirecting to ChatGPT for data synthesis.");
                                  }}
                                  className="gold-button px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                  <ExternalLink className="w-4 h-4" /> Synchronize with ChatGPT
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="space-y-4">
                                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Protocol Instructions
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                      Execute the synchronized prompt in ChatGPT. Return with the generated JSON and paste it into the secure terminal interface.
                                    </p>
                                  </div>
                                  <button
                                    onClick={handleAIInject}
                                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 border border-emerald-400/20"
                                  >
                                    <Activity className="w-4 h-4" /> Inject Synthesized Data
                                  </button>
                                </div>
                                <div className="relative">
                                  <textarea
                                    value={aiPromptData}
                                    onChange={(e) => {
                                      setAiPromptData(e.target.value);
                                      if (parsingError) setParsingError(null);
                                    }}
                                    placeholder='Paste JSON response here...'
                                    className={`w-full h-full min-h-[150px] bg-[#020617] border-2 rounded-2xl p-4 text-xs text-white font-mono focus:outline-none transition-all resize-none shadow-inner ${parsingError ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-emerald-500/50'}`}
                                  />
                                  {parsingError && (
                                    <div className="absolute bottom-4 right-4 text-[10px] text-red-400 font-bold bg-black/90 px-3 py-1.5 rounded-lg backdrop-blur border border-red-500/30 shadow-xl">
                                      {parsingError}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* LIVE DATA MAPPING VISUALIZATION */}
                              <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                  <Activity className="w-3 h-3" /> Data Mapping Preview
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                                  {relevantTextFields.map((field) => {
                                    let mappedValue: string | null = null;
                                    try {
                                      if (aiPromptData.trim()) {
                                        const parsed = JSON.parse(aiPromptData);
                                        // Try exact ID match first, then Title match
                                        if (parsed[field.id]) mappedValue = Array.isArray(parsed[field.id]) ? parsed[field.id][0] : parsed[field.id];
                                        else if (parsed[field.title]) mappedValue = Array.isArray(parsed[field.title]) ? parsed[field.title][0] : parsed[field.title];
                                        // If array of objects? (Not standard for this simple logic but safe fallback)
                                      }
                                    } catch (e) { /* ignore parse errors for preview */ }

                                    const isMapped = !!mappedValue;

                                    return (
                                      <div key={field.id} className={`flex items-center justify-between p-3 rounded-lg border ${isMapped ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMapped ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-amber-500/50'}`} />
                                          <span className="text-[11px] font-medium text-slate-300 truncate max-w-[150px]" title={field.title}>
                                            {field.title}
                                            {field.required && <span className="ml-2 text-[9px] text-amber-500 bg-amber-500/10 px-1 rounded opacity-70">*</span>}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 max-w-[50%]">
                                          <ArrowRight className={`w-3 h-3 ${isMapped ? 'text-emerald-500' : 'text-slate-600'}`} />
                                          <span className={`text-[10px] font-mono truncate ${isMapped ? 'text-emerald-100' : 'text-slate-600 italic'}`}>
                                            {isMapped ? (mappedValue as string).substring(0, 30) + ((mappedValue as string).length > 30 ? '...' : '') : 'Pending data...'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* DATA PREVIEW / DEMOGRAPHICS */}
                        <div className="glass-panel p-1 rounded-xl flex flex-col h-[600px] border-t border-t-white/10 relative">
                          <div className="absolute top-0 inset-x-0 bg-amber-500/10 border-b border-amber-500/10 p-2 flex items-center justify-center gap-2 text-[10px] text-amber-300 font-mono z-20 backdrop-blur-sm">
                            <Activity className="w-3 h-3 text-amber-400" />
                            <span>Data Synthesis & Distribution Control</span>
                          </div>

                          <div className="px-6 py-4 mt-12 border-b border-white/5 flex flex-col gap-4 bg-white/[0.02]">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Field Distributions</span>
                              <div className="relative group">
                                <Settings className="w-4 h-4 text-slate-600 group-hover:text-amber-500 transition-colors" />
                              </div>
                            </div>

                            <div className="flex flex-col gap-3">
                              <div className="relative">
                                <Command className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  placeholder="Search fields (e.g. 'Age', 'Experience')..."
                                  value={questionSearch}
                                  onChange={(e) => setQuestionSearch(e.target.value)}
                                  className="w-full bg-[#050505] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[10px] text-white font-mono focus:border-amber-500/50 outline-none transition-all"
                                />
                              </div>

                              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                                <Settings className="w-4 h-4 text-amber-500 mt-0.5" />
                                <p className="text-[10px] text-amber-200/70 leading-relaxed font-sans">
                                  <strong>System Guidance:</strong> You may adjust the weightage percentages below to maintain a realistic distribution. Ensure the total for each field equals 100% for optimal consistency.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {analysis.questions
                              .filter(q => {
                                if (!questionSearch) return true;
                                return q.title.toLowerCase().includes(questionSearch.toLowerCase());
                              })
                              .map((q, qIdx) => {
                                // Find original index for state updates
                                const originalIdx = analysis.questions.findIndex(origQ => origQ.id === q.id);

                                return (
                                  <div key={q.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="flex justify-between items-start mb-4">
                                      <span className="text-sm text-slate-200 font-medium max-w-[80%] group-hover:text-white transition-colors capitalize">{q.title}</span>
                                      <span className="text-[9px] bg-white/5 px-2 py-1 rounded text-slate-500 font-mono uppercase tracking-tighter opacity-60">{q.type}</span>
                                    </div>

                                    <div className="space-y-3">
                                      {q.options.slice(0, 10).map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-3 text-[11px]">
                                          <div className="w-12 shrink-0">
                                            <input
                                              type="number"
                                              min="0" max="100"
                                              value={opt.weight || 0}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                const newAnalysis = { ...analysis };
                                                newAnalysis.questions[originalIdx].options[oIdx].weight = val;
                                                setAnalysis(newAnalysis);
                                              }}
                                              className="w-full bg-[#020617] border border-white/10 rounded px-1 py-1 text-center font-mono text-amber-500 focus:border-amber-500/50 outline-none h-7"
                                            />
                                          </div>
                                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-500" style={{ width: `${opt.weight}%` }} />
                                          </div>
                                          <div className="w-32 truncate text-slate-500 text-[10px]" title={opt.value}>{opt.value}</div>
                                        </div>
                                      ))}

                                      {(q.type === 'MULTIPLE_CHOICE' || q.type === 'CHECKBOXES' || q.type === 'DROPDOWN') && (
                                        <div className="flex justify-end pt-2 border-t border-white/5 mt-2">
                                          <span className={`text-[10px] font-mono font-bold ${q.options.reduce((a, b) => a + (b.weight || 0), 0) === 100 ? 'text-emerald-500' : 'text-red-400'}`}>
                                            FIELD TOTAL: {q.options.reduce((a, b) => a + (b.weight || 0), 0)}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
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
                      onBackToConfig={() => {
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

      {!loading && <Footer />}
    </div >
  );
}

export default App;