import React, { useMemo, useCallback, useState } from 'react';
import { Settings, CheckCircle, ArrowRight, Crown, AlertCircle, Target, ShieldCheck, Zap, Sparkles, Command, ExternalLink, Activity, RotateCcw, LayoutGrid, MessageSquare, Bot } from 'lucide-react';
import { FormAnalysis, FormQuestion, QuestionType, User } from '../types';
import QuestionCard from './QuestionCard';
import TagInput from './TagInput';
import { generateAIPrompt } from '../utils/parsingUtils';

// --- LOCAL BADGE ---
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

interface Step2DashboardProps {
    analysis: FormAnalysis;
    setAnalysis: React.Dispatch<React.SetStateAction<FormAnalysis | null>>;
    user: User | null;
    targetCount: number;
    setTargetCount: (val: number) => void;
    speedMode: 'auto' | 'manual';
    setSpeedMode: (mode: 'auto' | 'manual') => void;
    delayMin: number;
    setDelayMin: (val: number) => void;
    nameSource: 'auto' | 'indian' | 'custom';
    setNameSource: (src: 'auto' | 'indian' | 'custom') => void;
    customNamesRaw: string;
    setCustomNamesRaw: (val: string) => void;
    customResponses: Record<string, string>;
    setCustomResponses: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    aiPromptData: string;
    setAiPromptData: (val: string) => void;
    parsingError: string | null;
    setParsingError: (val: string | null) => void;
    handleCompile: () => void;
    handleAIInject: () => void;
    reset: () => void;
    setShowPricing: (show: boolean) => void;
    setShowRecommendationModal: (show: boolean) => void;
    checkBalanceAndRedirect: (val: number) => void;
    isLaunching: boolean;
    error: string | null;
}

type TabKey = 'settings' | 'questions' | 'ai';

const Step2Dashboard = React.memo((props: Step2DashboardProps) => {
    const {
        analysis,
        setAnalysis,
        user,
        targetCount,
        setTargetCount,
        speedMode,
        setSpeedMode,
        delayMin,
        setDelayMin,
        nameSource,
        setNameSource,
        customNamesRaw,
        setCustomNamesRaw,
        customResponses,
        setCustomResponses,
        aiPromptData,
        setAiPromptData,
        parsingError,
        setParsingError,
        handleCompile,
        handleAIInject,
        reset,
        setShowPricing,
        setShowRecommendationModal,
        checkBalanceAndRedirect,
        isLaunching,
        error
    } = props;

    const [activeTab, setActiveTab] = useState<TabKey>('settings');
    const [questionSearch, setQuestionSearch] = useState('');
    const [showBanner, setShowBanner] = useState(true);
    const [customCountActive, setCustomCountActive] = useState(false);

    // Update Single Question Handler
    const handleQuestionUpdate = useCallback((updatedQuestion: FormQuestion) => {
        setAnalysis(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                questions: prev.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
            } as FormAnalysis;
        });
    }, [setAnalysis]);

    const handleCustomResponseChange = useCallback((qId: string, val: string) => {
        setCustomResponses(prev => ({ ...prev, [qId]: val }));
    }, [setCustomResponses]);

    const filteredQuestions = useMemo(() => {
        return analysis.questions.filter(q => {
            if (!questionSearch) return true;
            return q.title.toLowerCase().includes(questionSearch.toLowerCase());
        });
    }, [analysis.questions, questionSearch]);

    // AI Data Injection Helpers
    const relevantTextFields = useMemo(() => analysis.questions.filter(q =>
        (q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.PARAGRAPH) &&
        !q.title.toLowerCase().includes('name')
    ), [analysis.questions]);

    const hasAITab = relevantTextFields.length > 0;
    const hasRequiredAI = relevantTextFields.some(q => q.required);

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = useMemo(() => {
        const t: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
            { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
            { key: 'questions', label: 'Questions', icon: <LayoutGrid className="w-4 h-4" />, badge: `${analysis.questions.length}` },
        ];
        if (hasAITab) {
            t.push({
                key: 'ai',
                label: 'AI Assistant',
                icon: <Bot className="w-4 h-4" />,
                badge: hasRequiredAI ? 'Required' : undefined
            });
        }
        return t;
    }, [analysis.questions.length, hasAITab, hasRequiredAI]);

    const presets = [5, 10, 25, 50, 75, 100];
    const isPreset = presets.includes(targetCount);

    const speedLabel = delayMin === 0 ? 'Warp' : delayMin === 100 ? 'Intensive' : delayMin === 500 ? 'Efficient' : 'Realistic';

    return (
        <section className="w-full animate-fade-in-up pb-28">

            {/* HEADER: Title + Badges */}
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 tracking-tight">{analysis.title}</h2>
                <div className="flex flex-wrap gap-3 items-center">
                    <Badge color="obsidian">{analysis.questions.length} Fields</Badge>
                    <Badge color="gold">Algorithm Optimized</Badge>
                    {user && (user.tokens || 0) < targetCount && (
                        <button
                            onClick={() => setShowPricing(true)}
                            className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse"
                        >
                            <Crown className="w-3 h-3" />
                            Low on tokens? Refill
                        </button>
                    )}
                </div>
            </div>

            {/* SMART DEFAULTS BANNER */}
            {showBanner && (
                <div className="mb-6 relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-teal-500/[0.04] p-4 animate-fade-in-up">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2.5 rounded-lg flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Smart defaults configured</p>
                                <p className="text-xs text-slate-400 mt-0.5">Everything is ready to go. Adjust settings below or hit <span className="text-emerald-400 font-semibold">Launch</span> at the bottom to start.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowBanner(false)}
                            className="text-slate-500 hover:text-white transition-colors text-lg px-2 flex-shrink-0"
                            aria-label="Dismiss banner"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* ERROR DISPLAY */}
            {error && (
                <div className="mb-6 flex items-center gap-3 text-red-200 bg-red-950/80 border border-red-500/30 px-6 py-4 rounded-xl text-sm font-medium backdrop-blur-xl shadow-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                </div>
            )}

            {/* TAB BAR */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/5 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] ${activeTab === tab.key
                                ? 'bg-white/10 text-white shadow-lg border border-white/10'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent'
                            }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.badge && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${tab.badge === 'Required'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-white/5 text-slate-500'
                                }`}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ─────────────────────────────────────── */}
            {/* TAB: SETTINGS                           */}
            {/* ─────────────────────────────────────── */}
            {activeTab === 'settings' && (
                <div className="space-y-8 animate-fade-in-up">

                    {/* RESPONSE COUNT */}
                    <div className="glass-panel p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                <Target className="w-4 h-4 text-emerald-500" />
                                Number of Responses
                            </div>
                            <button
                                onClick={() => setShowRecommendationModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95"
                            >
                                <ShieldCheck className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Academic Guide</span>
                            </button>
                        </div>

                        {/* PRESET PILLS */}
                        <div className="flex flex-wrap gap-2">
                            {presets.map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => {
                                        checkBalanceAndRedirect(preset);
                                        setTargetCount(preset);
                                        setCustomCountActive(false);
                                    }}
                                    className={`px-5 py-3 rounded-xl text-sm font-mono font-bold transition-all duration-200 active:scale-95 border ${targetCount === preset && !customCountActive
                                            ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    {preset}
                                </button>
                            ))}

                            {/* CUSTOM PILL */}
                            <button
                                onClick={() => setCustomCountActive(true)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-mono font-bold transition-all duration-200 active:scale-95 border ${customCountActive || (!isPreset && !isNaN(targetCount))
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/10'
                                    }`}
                            >
                                Custom:
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={customCountActive || !isPreset ? (isNaN(targetCount) ? '' : targetCount) : ''}
                                    placeholder="—"
                                    onClick={(e) => { e.stopPropagation(); setCustomCountActive(true); }}
                                    onChange={(e) => {
                                        setCustomCountActive(true);
                                        if (e.target.value === '') {
                                            setTargetCount(NaN);
                                            return;
                                        }
                                        const val = Math.min(Number(e.target.value), 100);
                                        checkBalanceAndRedirect(val);
                                        setTargetCount(val);
                                    }}
                                    className="w-10 bg-transparent text-center outline-none font-mono font-bold placeholder:text-current/40 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </button>
                        </div>

                        {/* TOKEN WARNING */}
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

                    {/* INTERACTION SPEED */}
                    <div className="glass-panel p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Interaction Speed
                            </div>
                            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${delayMin === 0
                                    ? 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20'
                                    : delayMin <= 100
                                        ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                        : delayMin <= 500
                                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                }`}>
                                {speedLabel} ({delayMin}ms)
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { mode: 'auto' as const, delay: null, label: 'Best Choice', desc: 'Recommended', color: 'emerald' },
                                { mode: 'manual' as const, delay: 1000, label: 'Steady', desc: 'Human-like', color: 'amber' },
                                { mode: 'manual' as const, delay: 0, label: 'Warp Drive', desc: '0 Latency', color: 'fuchsia' },
                            ].map(opt => {
                                const isActive = opt.mode === 'auto'
                                    ? speedMode === 'auto'
                                    : speedMode === 'manual' && (opt.delay === 0 ? delayMin === 0 : delayMin >= 1000);

                                const colorMap: Record<string, string> = {
                                    emerald: isActive ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.1)]' : '',
                                    amber: isActive ? 'bg-amber-500/15 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.1)]' : '',
                                    fuchsia: isActive ? 'bg-fuchsia-500/15 border-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.1)]' : '',
                                };

                                return (
                                    <button
                                        key={opt.label}
                                        onClick={() => {
                                            if (opt.mode === 'auto') {
                                                setSpeedMode('auto');
                                            } else {
                                                setSpeedMode('manual');
                                                setDelayMin(opt.delay!);
                                            }
                                        }}
                                        className={`flex flex-col items-center py-4 px-2 rounded-xl border transition-all duration-200 active:scale-95 ${isActive
                                                ? colorMap[opt.color]
                                                : 'bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/[0.06] hover:border-white/10 hover:text-slate-300'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{opt.label}</span>
                                        <span className="text-[8px] opacity-60">{opt.desc}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {speedMode === 'auto' && (
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
                                <CheckCircle className="w-3 h-3" />
                                Speed will be automatically optimized for safety
                            </div>
                        )}
                    </div>

                    {/* NAME SOURCE (only show if form has name fields) */}
                    {analysis.questions.some(q => q.title.toLowerCase().includes('name')) && (
                        <div className="glass-panel p-6 rounded-xl">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                    <Command className="w-4 h-4 text-amber-500" />
                                    Name Generator
                                </div>
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
                                        className={`relative overflow-hidden flex flex-col items-center py-4 rounded-xl border transition-all duration-200 active:scale-95 ${nameSource === opt.id
                                                ? 'bg-amber-500/15 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                                                : 'bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/[0.06] hover:border-white/10 hover:text-slate-300'
                                            }`}
                                    >
                                        {nameSource === opt.id && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-500" />}
                                        <span className="text-[10px] font-bold tracking-widest uppercase mb-1">{opt.label}</span>
                                        <span className="text-[8px] opacity-60">{opt.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {nameSource === 'custom' && (
                                <div className="mt-4">
                                    <TagInput
                                        value={customNamesRaw}
                                        onChange={(val) => setCustomNamesRaw(val)}
                                        placeholder="Enter names and press Enter or Comma..."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECURITY NOTE */}
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] text-red-200/60 leading-relaxed font-mono flex items-start gap-2">
                        <ShieldCheck className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>To maintain account integrity, avoid exceeding 100 responses per hour per IP address.</span>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────── */}
            {/* TAB: QUESTIONS                          */}
            {/* ─────────────────────────────────────── */}
            {activeTab === 'questions' && (
                <div className="animate-fade-in-up">
                    {/* Search + Tip */}
                    <div className="space-y-4 mb-6">
                        <div className="relative">
                            <Command className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search fields (e.g. 'Age', 'Experience')..."
                                value={questionSearch}
                                onChange={(e) => setQuestionSearch(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                            <Settings className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-200/70 leading-relaxed">
                                Adjust the weightage percentages to control how responses are distributed. Totals should equal 100% for each field.
                            </p>
                        </div>
                    </div>

                    {/* Question Cards  */}
                    <div className="space-y-4">
                        {filteredQuestions.map((q, idx) => (
                            <QuestionCard
                                key={q.id}
                                index={idx}
                                question={q}
                                onUpdate={handleQuestionUpdate}
                                customResponse={customResponses[q.id]}
                                onCustomResponseChange={(val) => handleCustomResponseChange(q.id, val)}
                            />
                        ))}
                    </div>

                    {filteredQuestions.length === 0 && questionSearch && (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-sm">No fields matching "{questionSearch}"</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─────────────────────────────────────── */}
            {/* TAB: AI ASSISTANT                       */}
            {/* ─────────────────────────────────────── */}
            {activeTab === 'ai' && hasAITab && (
                <div className="animate-fade-in-up">
                    <div className={`glass-panel p-6 rounded-xl space-y-6 border-l-2 ${parsingError ? 'border-red-500' : hasRequiredAI ? 'border-amber-500/50' : 'border-emerald-500/50'
                        }`}>
                        {/* HEADER */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-500" />
                                    AI-Generated Answers
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Need unique text responses? Let ChatGPT generate them for you.
                                </p>
                            </div>
                            {hasRequiredAI && (
                                <span className="text-[10px] text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 font-bold uppercase tracking-wider flex-shrink-0 animate-pulse">
                                    Required
                                </span>
                            )}
                        </div>

                        {/* STEPS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Instructions */}
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-emerald-400">1</span>
                                        </div>
                                        <p className="text-sm text-slate-300">
                                            Click the button below to copy a ready-made prompt and open ChatGPT.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-emerald-400">2</span>
                                        </div>
                                        <p className="text-sm text-slate-300">
                                            Paste the prompt in ChatGPT, copy its JSON response, and paste it on the right.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-emerald-400">3</span>
                                        </div>
                                        <p className="text-sm text-slate-300">
                                            Hit "Apply AI Data" and you're done!
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const prompt = generateAIPrompt(analysis.title, analysis.description, analysis.questions, targetCount);
                                        navigator.clipboard.writeText(prompt);
                                        window.open('https://chatgpt.com', '_blank');
                                        alert("Prompt copied to clipboard! Paste it in ChatGPT.");
                                    }}
                                    className="w-full gold-button px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Copy Prompt & Open ChatGPT
                                </button>

                                <button
                                    onClick={handleAIInject}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 border border-emerald-400/20"
                                >
                                    <Activity className="w-4 h-4" />
                                    Apply AI Data
                                </button>
                            </div>
                            {/* Textarea */}
                            <div className="relative">
                                <textarea
                                    value={aiPromptData}
                                    onChange={(e) => {
                                        setAiPromptData(e.target.value);
                                        if (parsingError) setParsingError(null);
                                    }}
                                    placeholder='Paste ChatGPT JSON response here...'
                                    className={`w-full h-full min-h-[250px] bg-[#020617] border-2 rounded-2xl p-4 text-xs text-white font-mono focus:outline-none transition-all resize-none shadow-inner ${parsingError ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-emerald-500/50'
                                        }`}
                                />
                                {parsingError && (
                                    <div className="absolute bottom-4 right-4 text-[10px] text-red-400 font-bold bg-black/90 px-3 py-1.5 rounded-lg backdrop-blur border border-red-500/30 shadow-xl max-w-[80%] truncate">
                                        {parsingError}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────── */}
            {/* STICKY LAUNCH BAR                       */}
            {/* ─────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up">
                <div className="max-w-5xl mx-auto px-4 pb-4">
                    <div className="relative overflow-hidden bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 px-5 py-3.5 flex items-center justify-between gap-4">
                        {/* Subtle gradient shine */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] via-transparent to-amber-500/[0.03] pointer-events-none" />

                        {/* Left: Form info */}
                        <div className="flex items-center gap-3 relative z-10 min-w-0">
                            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                                <span className="truncate max-w-[180px] font-medium text-slate-300">{analysis.title}</span>
                                <span className="text-slate-600">·</span>
                                <span className="font-mono text-amber-400 font-bold">{isNaN(targetCount) ? '—' : targetCount}</span>
                                <span>responses</span>
                                <span className="text-slate-600">·</span>
                                <span className={`font-mono ${delayMin === 0 ? 'text-fuchsia-400' : delayMin <= 500 ? 'text-amber-400' : 'text-emerald-400'
                                    }`}>{speedMode === 'auto' ? 'Auto' : speedLabel}</span>
                            </div>
                            <button
                                onClick={reset}
                                className="text-slate-500 hover:text-white transition-colors sm:border-l sm:border-white/5 sm:pl-3"
                                aria-label="Cancel"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Right: Launch button */}
                        <div className="relative flex-shrink-0 z-10">
                            <div className="absolute -inset-2 bg-emerald-500/10 rounded-2xl blur-xl animate-pulse" />
                            <button
                                onClick={handleCompile}
                                disabled={isLaunching}
                                className={`relative group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg border border-emerald-400/20 transition-all duration-200 ${isLaunching ? 'scale-95 brightness-75' : 'hover:scale-[1.02] active:scale-[0.97]'
                                    }`}
                            >
                                <Zap className="w-4 h-4 text-white" />
                                <span className="text-sm font-bold text-white uppercase tracking-wide">Launch Mission</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});

export default Step2Dashboard;
