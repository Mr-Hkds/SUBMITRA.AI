import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { paymentId, amount, userId } = req.body;

        if (!paymentId || !amount) {
            res.status(400).json({ error: 'Missing paymentId or amount' });
            return;
        }

        // --- AUTHENTICATION & CONFIGURATION ---

        // Razorpay Keys
        const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error('Razorpay keys missing in environment variables');
            res.status(500).json({ error: 'Server configuration error: Razorpay keys missing' });
            return;
        }

        // Firebase Admin Initialization (Lazy Load)
        if (userId && !process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.error('FIREBASE_SERVICE_ACCOUNT missing. Cannot credit tokens securely.');
            // We don't fail the request here to allow "authorized" response, but we can't credit.
            // In strict mode, we should fail.
        }

        let db = null;
        if (getApps().length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                initializeApp({
                    credential: cert(serviceAccount)
                });
                db = getFirestore();
            } catch (error) {
                console.error('Failed to initialize Firebase Admin:', error);
            }
        } else if (getApps().length > 0) {
            db = getFirestore();
        }

        // --- PAYMENT CAPTURE ---

        // Amount in paise
        const amountInPaise = Math.round(amount * 100);
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        console.log(`Verifying and capturing payment: ${paymentId} for ₹${amount}`);

        // Capture Payment with Razorpay
        const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: 'INR'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle "Already Captured" gracefully
            if (data.error?.code === 'BAD_REQUEST_ERROR' && data.error?.description?.includes('already captured')) {
                console.log('Payment already captured, proceeding to credit check...');
            } else {
                console.error('Razorpay Capture Error:', data);
                res.status(response.status).json({
                    error: data.error?.description || 'Failed to capture payment',
                    details: data
                });
                return;
            }
        }

        console.log('Payment captured successfully:', data.id || 'Already Captured');

        // --- SECURE TOKEN CREDITING ---

        if (userId && db) {
            try {
                console.log(`Crediting tokens to user: ${userId}`);

                // Determine tokens based on amount (Server-Side Validation)
                // ₹49 -> 70 tokens, ₹99 -> 150 tokens, ₹149 -> 250 tokens, ₹199 -> 400 tokens
                // We use Math.floor/round to handle potential float issues, but amount is usually exact int
                let tokensToCredit = 0;

                // Flexible pricing check (allowing small margin for error or currency conversion if any)
                if (amount >= 49 && amount < 60) tokensToCredit = 70;      // Starter
                else if (amount >= 99 && amount < 120) tokensToCredit = 150; // Student
                else if (amount >= 149 && amount < 170) tokensToCredit = 250; // Professional
                else if (amount >= 199) tokensToCredit = 400;               // Ultimate
                else {
                    // Fallback or custom amount logic
                    console.warn(`Amount ₹${amount} does not match standard packs. calculating pro-rata? No, skipping.`);
                }

                if (tokensToCredit > 0) {
                    const userRef = db.collection('users').doc(userId);
                    const transactionRef = db.collection('transactions').doc(paymentId); // Use paymentId as doc check for idempotency

                    await db.runTransaction(async (t) => {
                        const transDoc = await t.get(transactionRef);
                        if (transDoc.exists) {
                            throw new Error('Transaction already processed');
                        }

                        // Update User
                        t.update(userRef, {
                            tokens: FieldValue.increment(tokensToCredit),
                            isPremium: true,
                            lastPayment: FieldValue.serverTimestamp()
                        });

                        // Create Transaction Record
                        t.set(transactionRef, {
                            userId,
                            paymentId,
                            amount,
                            tokens: tokensToCredit,
                            status: 'completed',
                            method: 'razorpay_upi',
                            createdAt: FieldValue.serverTimestamp(),
                            timestamp: new Date().toISOString()
                        });
                    });

                    console.log(`Successfully credited ${tokensToCredit} tokens to ${userId}`);
                } else {
                    console.warn(`No tokens credited. Amount ₹${amount} did not match any plan.`);
                }

            } catch (err) {
                if (err.message === 'Transaction already processed') {
                    console.log('Idempotency check: Tokens already credited.');
                } else {
                    console.error('Token crediting error:', err);
                    // We DO NOT fail the request if crediting fails (payment is already captured!)
                    // We should probably alert admin or retry
                }
            }
        } else if (userId && !db) {
            console.warn('Skipping token credit: DB not initialized (Missing Service Account?)');
        }

        res.status(200).json({
            success: true,
            payment: data,
            verified: true,
            message: 'Payment verified and captured'
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
