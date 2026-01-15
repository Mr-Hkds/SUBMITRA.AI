import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Upload, AlertCircle, QrCode, Coins, Zap, Crown } from 'lucide-react';
import { createPaymentRequest, checkPendingRequest } from '../services/paymentService';
import { User } from '../types';

interface PaymentModalProps {
    onClose: () => void;
    user: User;
}

const TOKEN_PACKS = [
    {
        id: 'starter',
        name: 'Exam Cram',
        tokens: 80,
        price: 29,
        icon: Coins,
        color: 'from-slate-700 to-slate-900',
        textColor: 'text-slate-200',
        border: 'border-slate-500/30'
    },
    {
        id: 'pro',
        name: 'Semester Pro',
        tokens: 400,
        price: 99,
        popular: true,
        icon: Zap,
        color: 'from-amber-600 to-amber-800',
        textColor: 'text-amber-200',
        border: 'border-amber-500/50'
    },
    {
        id: 'ultra',
        name: 'Degree Saver',
        tokens: 1000,
        price: 249,
        icon: Crown,
        color: 'from-emerald-600 to-emerald-900',
        textColor: 'text-emerald-200',
        border: 'border-emerald-500/50'
    }
];

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, user }) => {
    // Step 1: Select Pack, Step 2: Payment Details
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedPack, setSelectedPack] = useState(TOKEN_PACKS[1]); // Default to Pro

    const [utr, setUtr] = useState('');
    const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            if (user.uid) {
                const isPending = await checkPendingRequest(user.uid);
                if (isPending) {
                    setSuccess(true);
                }
            }
            setChecking(false);
        };
        checkStatus();
    }, [user.uid]);

    // Helper: Compress Image to Base64
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_DIM = 600; // Reduced for faster processing
                    if (width > height) {
                        if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
                    } else {
                        if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.6)); // Lower quality for speed
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];
                if (file.size > 5 * 1024 * 1024) {
                    setError("File too large. Max 5MB.");
                    return;
                }
                const compressed = await compressImage(file);
                setScreenshotBase64(compressed);
                setError(null);
            } catch (err) {
                setError("Failed to process image. Try another.");
            }
        }
    };

    const handleSubmit = async () => {
        if (!utr || !screenshotBase64) {
            setError("Please provide both UTR number and Screenshot");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await createPaymentRequest(user.uid, user.email || 'Unknown', selectedPack.price, selectedPack.tokens, utr, screenshotBase64);

            setSuccess(true);
        } catch (e) {
            console.error(e);
            setError("Failed to submit request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checking) return null;

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in-up">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={onClose} />
                <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-emerald-500/30 rounded-3xl shadow-2xl p-8 text-center animate-scale-in backdrop-blur-xl">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-3">Payment Submitted!</h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Thank you for trusting us! Your payment will be verified within 24 hours and tokens will be credited to your account.
                    </p>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-6">
                        <p className="text-xs text-slate-400 mb-2">Need help?</p>
                        <a
                            href="mailto:naagraazproduction@gmail.com"
                            className="text-sm text-amber-400 hover:text-amber-300 font-mono transition-colors"
                        >
                            naagraazproduction@gmail.com
                        </a>
                    </div>
                    <button onClick={onClose} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold h-12 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-white/10 rounded-3xl shadow-2xl overflow-visible animate-scale-in backdrop-blur-xl">

                {/* Close Button - Fixed in top-right corner */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[200] w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700/90 border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group shadow-lg backdrop-blur-sm"
                >
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="relative bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-8 pr-20 border-b border-white/5 overflow-hidden">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-white mb-1 tracking-tight">Refill Your Account</h3>
                            <p className="text-slate-400 text-sm">Select a token pack to continue generating responses.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500 tracking-widest uppercase mb-1">Current Balance</div>
                            <div className="text-2xl font-bold font-mono bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">{user.tokens || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {step === 1 ? (
                        <div className="space-y-8 animate-fade-in-right">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {TOKEN_PACKS.map((pack, index) => (
                                    <div
                                        key={pack.id}
                                        onClick={() => setSelectedPack(pack)}
                                        style={{ animationDelay: `${index * 50} ms` }}
                                        className={`relative p - 6 rounded - 2xl border cursor - pointer transition - all duration - 500 group animate - slide - up
                                            ${selectedPack.id === pack.id
                                                ? `bg-gradient-to-br ${pack.color} border-transparent shadow-xl shadow-amber-500/20 scale-[1.02] ring-2 ring-amber-500/30`
                                                : 'bg-white/[0.02] border-white/10 hover:border-amber-500/30 hover:bg-white/5 hover:scale-[1.01]'
                                            }
`}
                                    >
                                        {pack.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg animate-bounce">
                                                Best Value
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center text-center space-y-4 pt-2">
                                            <div className={`w - 14 h - 14 rounded - xl ${selectedPack.id === pack.id ? 'bg-white/10' : 'bg-white/5'} flex items - center justify - center transition - all duration - 300 group - hover: scale - 110`}>
                                                <pack.icon className={`w - 7 h - 7 transition - colors duration - 300 ${selectedPack.id === pack.id ? 'text-white' : 'text-amber-500'} `} />
                                            </div>
                                            <div>
                                                <div className={`text - 3xl font - bold font - mono transition - colors duration - 300 ${selectedPack.id === pack.id ? 'text-white' : 'text-white/90'} `}>
                                                    {pack.tokens}
                                                </div>
                                                <div className={`text - [10px] uppercase tracking - [0.2em] font - semibold mt - 1 transition - colors duration - 300 ${selectedPack.id === pack.id ? 'text-white/80' : 'text-slate-500'} `}>
                                                    Tokens
                                                </div>
                                            </div>
                                            <div className={`text - xl font - semibold transition - colors duration - 300 ${selectedPack.id === pack.id ? 'text-amber-200' : 'text-amber-400'} `}>
                                                ₹{pack.price}
                                            </div>
                                        </div>
                                        {selectedPack.id === pack.id && (
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Token Explanation */}
                            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                <p className="text-xs text-amber-200 font-medium">1 Token = 1 Form Response Generated</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-3 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] group"
                                >
                                    Continue to Payment
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in-right">
                            <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white flex items-center gap-2 mb-4 transition-colors duration-300 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> Back to Packs
                            </button>

                            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-white/5 to-white/[0.02] rounded-xl border border-white/10 backdrop-blur-sm">
                                <div className={`w - 14 h - 14 rounded - xl bg - gradient - to - br ${selectedPack.color} flex items - center justify - center shadow - lg`}>
                                    <selectedPack.icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Unlocking</div>
                                    <div className="text-lg text-white font-bold">{selectedPack.tokens} Tokens</div>
                                </div>
                                <div className="text-2xl font-mono font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">₹{selectedPack.price}</div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-inner">
                                    <img
                                        src="/payment-qr.png"
                                        alt="Payment QR"
                                        className="w-44 h-44 object-contain"
                                    />
                                    <p className="text-xs text-slate-600 mt-4 font-mono font-semibold">Scan to Pay ₹{selectedPack.price}</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">Transaction ID (UTR)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter 12-digit UTR"
                                            value={utr}
                                            onChange={(e) => setUtr(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">Payment Screenshot</label>
                                        <div className="relative group">
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                                            <label
                                                htmlFor="file-upload"
                                                className={`w - full flex flex - col items - center justify - center gap - 3 px - 4 py - 8 border - 2 border - dashed rounded - xl cursor - pointer transition - all duration - 300
                                                    ${screenshotBase64
                                                        ? 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10'
                                                        : 'border-white/20 hover:border-amber-500/50 hover:bg-white/5'
                                                    } `}
                                            >
                                                {screenshotBase64 ? (
                                                    <>
                                                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                                                        <span className="text-sm font-medium text-emerald-400">Screenshot Uploaded ✓</span>
                                                        <span className="text-xs text-slate-500">Click to change</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-amber-400 transition-colors duration-300" />
                                                        <span className="text-sm text-slate-400 group-hover:text-white transition-colors duration-300">Upload Payment Proof</span>
                                                        <span className="text-xs text-slate-600">PNG, JPG (Max 5MB)</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !utr || !screenshotBase64}
                                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-2 mt-6 transition-all duration-300 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            "Confirm Payment"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
