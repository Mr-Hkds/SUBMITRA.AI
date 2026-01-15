import React, { useState } from 'react';
import { Key, ShieldCheck, ExternalLink, AlertTriangle, Save, LogOut } from 'lucide-react';

interface ApiKeyModalProps {
    onClose: () => void;
    onSave: (key: string) => Promise<void> | void;
    errorType?: string; // e.g., "QUOTA_EXCEEDED"
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSave, errorType }) => {
    const [apiKey, setApiKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (apiKey.trim().length > 10) {
            setIsSaving(true);
            try {
                await onSave(apiKey.trim());
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in-up">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            <div className="max-w-lg w-full glass-panel p-8 rounded-2xl border border-amber-500/20 shadow-2xl relative z-10">

                {/* Header with Icon */}
                {/* Header with Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-amber-500/20 border border-white/10 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Key className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-white mb-2">
                        OpenRouter API Key Required
                    </h2>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                        Uses 100% <span className="text-emerald-400">FREE models</span> (DeepSeek, Llama, Gemini Free).<br />
                        <span className="text-xs text-slate-500">No credits needed!</span>
                    </p>
                </div>

                {/* Warning / Privacy Note */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 flex gap-3">
                    <div className="mt-0.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white block mb-1">100% Free Models Only</strong>
                        Your OpenRouter key accesses completely free models:
                        <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-400">
                            <li>DeepSeek R1 & V3 (unlimited)</li>
                            <li>Gemini 2.0 Flash (free tier)</li>
                            <li>Llama 3.3 70B (community free)</li>
                        </ul>
                    </div>
                </div>

                {/* Input Field */}
                <div className="space-y-4 mb-8">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key className="h-4 w-4 text-slate-500 group-focus-within:text-white transition-colors" />
                        </div>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Paste Google or OpenRouter Key..."
                            className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg leading-5 bg-black/40 text-white placeholder-slate-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 sm:text-sm transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-amber-500 hover:text-amber-400 transition-colors"
                        >
                            Get Free Google Key <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-slate-700">|</span>
                        <a
                            href="https://openrouter.ai/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-400 transition-colors"
                        >
                            Get OpenRouter <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-slate-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={apiKey.length < 10 || isSaving}
                        className="flex-[2] bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold py-3 px-4 rounded-lg shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Connect & Retry
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-[10px] text-slate-600 font-mono">
                        Error Code: {errorType || 'QUOTA_LIMIT_EXCEEDED'}
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ApiKeyModal;
