import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Upload, AlertCircle, QrCode, Coins, Zap, Crown, CreditCard, Shield, Lock, ShieldCheck } from 'lucide-react';
import { createPaymentOrder, initializeRazorpayCheckout, verifyAndCapturePayment } from '../services/razorpayService';
import { addTokens } from '../services/authService';

import { User } from '../types';

interface PaymentModalProps {
    onClose: () => void;
    user: User;
}

const TOKEN_PACKS = [
    {
        id: 'starter',
        name: 'Starter',
        tokens: 70,
        price: 49,
        icon: Zap,
        color: 'from-blue-600 to-blue-900',
        textColor: 'text-blue-200',
        border: 'border-blue-500/50',
        pricePerToken: 0.70
    },
    {
        id: 'student',
        name: 'Student',
        tokens: 150,
        price: 99,
        popular: true,
        popularLabel: 'Most Popular',
        icon: Crown,
        color: 'from-indigo-600 to-indigo-900',
        textColor: 'text-indigo-200',
        border: 'border-indigo-500/50',
        pricePerToken: 0.66,
        savings: '6% OFF'
    },
    {
        id: 'professional',
        name: 'Professional',
        tokens: 250,
        price: 149,
        icon: ShieldCheck,
        color: 'from-amber-600 to-amber-800',
        textColor: 'text-amber-200',
        border: 'border-amber-500/50',
        pricePerToken: 0.60,
        savings: '15% OFF'
    },
    {
        id: 'ultimate',
        name: 'Ultimate',
        tokens: 400,
        price: 199,
        popular: true,
        popularLabel: 'Best Value',
        icon: ShieldCheck,
        color: 'from-emerald-600 to-emerald-900',
        textColor: 'text-emerald-200',
        border: 'border-emerald-500/50',
        pricePerToken: 0.50,
        savings: '30% OFF'
    }
];

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, user }) => {
    // Step 1: Select Pack, Step 2: Razorpay Payment
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedPack, setSelectedPack] = useState(TOKEN_PACKS[1]); // Default to Student (₹99) - Most Popular

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

            // Ensure we have an email
            const paymentEmail = user.email || prompt("Please confirm your email address for the receipt:");
            if (!paymentEmail) {
                alert("Email is required for payment receipt.");
                setRazorpayProcessing(false);
                return;
            }

            console.log('🚀 Initiating Razorpay payment...');

            // Create payment order
            const order = await createPaymentOrder({
                amount: selectedPack.price,
                tokens: selectedPack.tokens,
                userEmail: paymentEmail,
                userId: user.uid,
                userName: user.displayName || paymentEmail.split('@')[0] || 'User',
            });

            // Initialize Razorpay checkout
            initializeRazorpayCheckout(
                order,
                {
                    amount: selectedPack.price,
                    tokens: selectedPack.tokens,
                    userEmail: paymentEmail,
                    userId: user.uid,
                    userName: user.displayName,
                },
                async (response) => {
                    // Payment successful
                    await handlePaymentSuccess(response, order.orderId, paymentEmail);
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
    const handlePaymentSuccess = async (response: any, orderId: string, paymentEmail: string) => {
        try {
            console.log('✅ Payment successful, verifying and capturing...');

            // Verify and Capture payment via backend
            // Included: Secure Server-Side Token Crediting
            const verificationResult = await verifyAndCapturePayment(
                response.razorpay_payment_id,
                selectedPack.price,
                user.uid
            );

            console.log('🎉 Payment Verified!', verificationResult);

            // Manual Client-Side Credit (Reliability Fallback)
            // Essential for local dev where Vite proxy doesn't handle DB updates
            console.log(`💳 Crediting ${selectedPack.tokens} tokens to user...`);
            await addTokens(user.uid, selectedPack.tokens);

            // Force a small delay to allow Firestore propagation if using real-time listeners
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccess(true);
            setRazorpayProcessing(false);

        } catch (error: any) {
            console.error('❌ Payment success handler error:', error);
            setError(error.message || 'Failed to capture payment. Please contact support with your payment ID.');
            setRazorpayProcessing(false);
        }
    };

    // if (checking) return null; // Removed

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in-up">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={onClose} />
                <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-emerald-500/30 rounded-3xl shadow-2xl p-6 md:p-8 text-center animate-scale-in backdrop-blur-xl">
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
            <div className="relative w-full max-w-5xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-white/10 rounded-3xl shadow-2xl overflow-visible animate-scale-in backdrop-blur-xl">

                {/* Close Button - Fixed in top-right corner */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 md:top-6 md:right-6 z-[200] w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800/80 hover:bg-slate-700/90 border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group shadow-lg backdrop-blur-sm"
                >
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="relative bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 md:p-8 pr-16 md:pr-20 border-b border-white/5 overflow-hidden">
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

                <div className="p-4 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {step === 1 ? (
                        <div className="space-y-8 animate-fade-in-right">
                            {/* Responsive Grid / Scroll Container */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto pb-6 pt-6 px-2 snap-x snap-mandatory hide-scrollbar">
                                {TOKEN_PACKS.map((pack, index) => (
                                    <div
                                        key={pack.id}
                                        onClick={() => setSelectedPack(pack)}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 group h-full flex flex-col justify-between min-h-[260px] snap-center min-w-[240px] lg:min-w-0
                                            ${selectedPack.id === pack.id
                                                ? `bg-slate-900/90 border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50 scale-[1.03] z-10`
                                                : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05] hover:scale-[1.02] z-0'
                                            }
                                        `}
                                    >
                                        {/* Glow Effect for Selected */}
                                        {selectedPack.id === pack.id && (
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
                                        )}

                                        {/* Selection Check Circle */}
                                        <div className={`absolute top-3 right-3 z-20 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${selectedPack.id === pack.id
                                            ? 'bg-amber-500 border-amber-500 text-black scale-100 opacity-100'
                                            : 'border-white/20 bg-transparent text-transparent scale-90 opacity-0'
                                            }`}>
                                            <CheckCircle className="w-3 h-3" strokeWidth={3} />
                                        </div>

                                        {/* Popular Badge */}
                                        {pack.popular && (
                                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30">
                                                <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_3px_12px_rgba(245,158,11,0.4)] whitespace-nowrap flex items-center gap-1">
                                                    <Crown className="w-2.5 h-2.5 fill-black/20 text-black" />
                                                    {(pack as any).popularLabel || "Best Value"}
                                                </div>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex flex-col items-center text-center space-y-3 pt-4 flex-1 relative z-10">

                                            {/* Icon Circle */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${selectedPack.id === pack.id
                                                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                                : 'bg-white/5 group-hover:bg-white/10'
                                                }`}>
                                                <pack.icon className={`w-6 h-6 transition-colors duration-300 ${selectedPack.id === pack.id ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]' : 'text-slate-500 group-hover:text-amber-200'
                                                    }`} />
                                            </div>

                                            {/* Name */}
                                            <h4 className={`text-base font-serif font-bold transition-colors tracking-wide ${selectedPack.id === pack.id ? 'text-white' : 'text-slate-400'}`}>
                                                {pack.name}
                                            </h4>

                                            {/* Token Count (Hero) */}
                                            <div className="space-y-0.5">
                                                <div className={`text-4xl font-black tracking-tighter ${selectedPack.id === pack.id
                                                    ? 'bg-gradient-to-b from-white via-white to-slate-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                                                    : 'text-white/80'
                                                    }`}>
                                                    {pack.tokens}
                                                </div>
                                                <div className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-bold">
                                                    Tokens
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className={`w-full h-px transition-colors ${selectedPack.id === pack.id ? 'bg-gradient-to-r from-transparent via-amber-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`} />

                                            {/* Price & Savings */}
                                            <div className="space-y-1.5 w-full relative">
                                                <div className={`text-2xl font-mono font-bold ${selectedPack.id === pack.id ? 'text-amber-400' : 'text-slate-300'}`}>
                                                    ₹{pack.price}
                                                </div>

                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="text-[9px] font-medium text-slate-500">
                                                        ₹{(pack as any).pricePerToken?.toFixed(2)} / token
                                                    </div>
                                                    {(pack as any).savings && (
                                                        <div className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border inline-block transition-all ${selectedPack.id === pack.id
                                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                                            : 'bg-emerald-500/10 text-emerald-500/80 border-emerald-500/10'
                                                            }`}>
                                                            SAVE {(pack as any).savings}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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
                            <button
                                onClick={() => setStep(1)}
                                className="text-xs text-slate-400 hover:text-white flex items-center gap-2 mb-2 transition-all duration-300 group hover:-translate-x-1"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Packs
                            </button>

                            {/* Main Card - God-Tier Glassmorphism */}
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f18] shadow-2xl">
                                {/* Ambient Background Glows */}
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse-slow"></div>
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                                <div className="p-8 relative z-10">
                                    {/* Header - Animated Lock */}
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400/20 to-amber-600/5 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.15)] mb-4 animate-float">
                                            <Lock className="w-8 h-8 text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight mb-1">Confirm Payment</h3>
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            <span>Bank-grade 256-bit SSL Ecryption</span>
                                        </div>
                                    </div>

                                    {/* Purchase Summary Card */}
                                    <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 hover:bg-white/[0.05] transition-colors duration-500 group">
                                        <div className="flex items-center justify-between items-start">
                                            <div className="flex gap-4">
                                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedPack.color} p-0.5`}>
                                                    <div className="w-full h-full bg-slate-900/50 rounded-[10px] flex items-center justify-center backdrop-blur-sm">
                                                        <selectedPack.icon className="w-7 h-7 text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Purchasing</div>
                                                    <div className="text-xl font-bold text-white">{selectedPack.name}</div>
                                                    <div className="text-sm text-amber-400 flex items-center gap-1">
                                                        {selectedPack.tokens} Tokens <Zap className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total</div>
                                                <div className="text-3xl font-mono font-bold text-white tracking-tight">₹{selectedPack.price}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email Confirmation */}
                                    <div className="mb-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                                        <span>Receipt will be sent to:</span>
                                        <span className="text-amber-500 font-mono">{user.email}</span>
                                    </div>

                                    {error && (
                                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            <p className="text-sm font-medium text-red-200">{error}</p>
                                        </div>
                                    )}

                                    {/* Action Button - The "God" Button */}
                                    <button
                                        onClick={handleRazorpayPayment}
                                        disabled={razorpayProcessing}
                                        className="relative w-full group overflow-hidden rounded-xl p-[1px] shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] transition-shadow duration-500"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-gradient-x"></div>
                                        <div className="relative bg-slate-900 h-14 rounded-[11px] flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                            {razorpayProcessing ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                    <span className="font-bold text-amber-500 uppercase tracking-wider text-xs">Processing...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-white font-bold text-lg tracking-wide group-hover:scale-105 transition-transform">PAY NOW</span>
                                                    <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {/* Trust Badges */}
                                    <div className="mt-8 flex justify-center gap-6 opacity-60">
                                        <div className="tooltip flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-help" title="Official Razorpay Merchant">
                                            <Shield className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Verified Merchant</span>
                                        </div>
                                        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                                            <Lock className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Secure AES-256</span>
                                        </div>
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
