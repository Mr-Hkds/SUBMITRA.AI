import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Upload, AlertCircle, QrCode, Coins, Zap, Crown, CreditCard, Shield, Lock } from 'lucide-react';
import { createPaymentOrder, initializeRazorpayCheckout, verifyPaymentSignature } from '../services/razorpayService';
import { creditTokensAutomatically } from '../services/autoPaymentService';
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
    // Step 1: Select Pack, Step 2: Razorpay Payment
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedPack, setSelectedPack] = useState(TOKEN_PACKS[1]); // Default to Pro

    const [loading, setLoading] = useState(false);
    // checking state removed (manual payment deprecated)
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [razorpayProcessing, setRazorpayProcessing] = useState(false);

    // Pending request check removed (manual payment deprecated)

    // Razorpay Payment Handler
    const handleRazorpayPayment = async () => {
        try {
            setRazorpayProcessing(true);
            setError(null);

            console.log('🚀 Initiating Razorpay payment...');

            // Create payment order
            const order = await createPaymentOrder({
                amount: selectedPack.price,
                tokens: selectedPack.tokens,
                userEmail: user.email || '',
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || 'User',
            });

            // Initialize Razorpay checkout
            initializeRazorpayCheckout(
                order,
                {
                    amount: selectedPack.price,
                    tokens: selectedPack.tokens,
                    userEmail: user.email || '',
                    userId: user.uid,
                    userName: user.displayName,
                },
                async (response) => {
                    // Payment successful
                    await handlePaymentSuccess(response, order.orderId);
                },
                (error) => {
                    // Payment failed/cancelled
                    console.error('❌ Payment failed:', error);
                    setError(error.message || 'Payment failed. Please try again.');
                    setRazorpayProcessing(false);
                }
            );

        } catch (error: any) {
            console.error('❌ Razorpay error:', error);
            setError(error.message || 'Failed to initiate payment. Please try again.');
            setRazorpayProcessing(false);
        }
    };

    // Handle successful Razorpay payment
    const handlePaymentSuccess = async (response: any, orderId: string) => {
        try {
            console.log('✅ Payment successful, verifying...');

            // Verify payment signature
            const isValid = verifyPaymentSignature(
                orderId,
                response.razorpay_payment_id,
                response.razorpay_signature
            );

            if (!isValid) {
                throw new Error('Payment verification failed. Please contact support.');
            }

            // Credit tokens automatically
            await creditTokensAutomatically(
                user.uid,
                selectedPack.tokens,
                response.razorpay_payment_id,
                orderId,
                user.email || ''
            );

            console.log('🎉 Tokens credited successfully!');
            setSuccess(true);
            setRazorpayProcessing(false);

        } catch (error: any) {
            console.error('❌ Payment success handler error:', error);
            setError(error.message || 'Failed to credit tokens. Please contact support with your payment ID.');
            setRazorpayProcessing(false);
        }
    };

    // if (checking) return null; // Removed

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in-up">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={onClose} />
                <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-emerald-500/30 rounded-3xl shadow-2xl p-8 text-center animate-scale-in backdrop-blur-xl">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-3">Tokens Credited!</h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Thank you for your purchase! Your payment has been secured by Razorpay and tokens have been added to your account instantly.
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
                        // Step 2: Razorpay Payment
                        <div className="space-y-6 animate-fade-in-right">
                            <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white flex items-center gap-2 mb-4 transition-colors duration-300 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> Back to Packs
                            </button>

                            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-white/5 to-white/[0.02] rounded-xl border border-white/10 backdrop-blur-sm">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedPack.color} flex items-center justify-center shadow-lg`}>
                                    <selectedPack.icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Unlocking</div>
                                    <div className="text-lg text-white font-bold">{selectedPack.tokens} Tokens</div>
                                </div>
                                <div className="text-2xl font-mono font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">₹{selectedPack.price}</div>
                            </div>

                            {/* Razorpay Payment Section - Premium Design */}
                            <div className="space-y-6">
                                {/* Trust & Security Header */}
                                <div className="text-center mb-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
                                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">100% Secure Payment</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-1">Complete Your Purchase</h4>
                                    <p className="text-sm text-slate-400 max-w-xs mx-auto">
                                        Your payment information is encrypted and secure.
                                    </p>
                                </div>

                                {/* Security Benefits Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-3 hover:bg-white/[0.05] transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                            <Lock className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">256-bit SSL</div>
                                            <div className="text-[10px] text-slate-400">Bank-grade Security</div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-3 hover:bg-white/[0.05] transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">Instant Credit</div>
                                            <div className="text-[10px] text-slate-400">Tokens in 2 seconds</div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-pulse">
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                        <p className="text-sm text-red-200">{error}</p>
                                    </div>
                                )}

                                {/* Premium Pay Button */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                    <button
                                        onClick={handleRazorpayPayment}
                                        disabled={razorpayProcessing}
                                        className="relative w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold h-16 rounded-xl flex items-center justify-between px-6 transition-all duration-300 shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 disabled:shadow-none hover:translate-y-[-1px] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-3">
                                            {razorpayProcessing ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                    <CreditCard className="w-5 h-5 text-white" />
                                                </div>
                                            )}
                                            <div className="text-left leading-tight">
                                                <div className="text-[10px] text-amber-100 uppercase tracking-wider font-semibold">Total Amount</div>
                                                <div className="text-lg">Pay ₹{selectedPack.price}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-white/90">Proceed</span>
                                            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                                        </div>

                                        {/* Security Badge Overlay */}
                                        <div className="absolute top-0 right-0 p-2 opacity-50">
                                            <Shield className="w-12 h-12 text-white/10 rotate-12" />
                                        </div>
                                    </button>
                                </div>

                                {/* Trust Footer */}
                                <div className="pt-2">
                                    <div className="flex items-center justify-center gap-4 mb-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                        <div className="flex flex-col items-center">
                                            <div className="text-[10px] font-bold text-white mb-1">UPI</div>
                                            <div className="w-8 h-0.5 bg-white/20 rounded-full"></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-[10px] font-bold text-white mb-1">CARDS</div>
                                            <div className="w-8 h-0.5 bg-white/20 rounded-full"></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-[10px] font-bold text-white mb-1">NETBANKING</div>
                                            <div className="w-12 h-0.5 bg-white/20 rounded-full"></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                        <span>Verified and Secured by <strong>Razorpay</strong></span>
                                        <span className="mx-1">•</span>
                                        <span>PCI DSS Compliant</span>
                                    </div>
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
