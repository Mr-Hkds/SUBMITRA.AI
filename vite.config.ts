import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Last Build Trigger: v4.0.2 Force Update
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'configure-response-headers',
        configureServer: (server) => {
          server.middlewares.use(async (req, res, next) => {
            // Handle /api/deduct-tokens (Local Server Simulation)
            if (req.url?.startsWith('/api/deduct-tokens') && req.method === 'POST') {
              console.log('[Vite Proxy] Processing Token Deduction...');

              let body = '';
              req.on('data', chunk => body += chunk.toString());
              req.on('end', async () => {
                try {
                  const { uid, amount } = JSON.parse(body);

                  // 1. Try Real Persistence (if keys exist)
                  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    try {
                      // Dynamic Import to avoid bundling issues if unused
                      const admin = await import('firebase-admin');

                      // Init Admin if needed
                      if (admin.default.apps.length === 0) {
                        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                        admin.default.initializeApp({
                          credential: admin.default.credential.cert(serviceAccount)
                        });
                        console.log('[Vite Proxy] 🔥 Firebase Admin Initialized');
                      }

                      const db = admin.default.firestore();
                      const userRef = db.collection('users').doc(uid);

                      await db.runTransaction(async (t) => {
                        const doc = await t.get(userRef);
                        if (!doc.exists) throw new Error("User not found");
                        const current = doc.data()?.tokens || 0;
                        if (current < amount) throw new Error("Insufficient funds");

                        t.update(userRef, {
                          tokens: admin.default.firestore.FieldValue.increment(-amount),
                          responsesUsed: admin.default.firestore.FieldValue.increment(amount)
                        });
                        return current - amount;
                      });

                      console.log(`[Vite Proxy] ✅ PERSISTED deduction of ${amount} tokens for ${uid}`);
                      // Fetch new balance to return exact
                      const freshSnap = await userRef.get();
                      const newTokens = freshSnap.data()?.tokens ?? 0;

                      res.setHeader('Content-Type', 'application/json');
                      res.statusCode = 200;
                      res.end(JSON.stringify({ success: true, newTokens }));
                      return; // Done

                    } catch (persistErr) {
                      console.error('[Vite Proxy] ⚠️ Persistence Failed (Falling back to mock):', persistErr.message);
                      // Fallthrough to mock if auth fails
                    }
                  } else {
                    console.log('[Vite Proxy] ℹ️ No FIREBASE_SERVICE_ACCOUNT found in .env. Using non-persistent mock.');
                  }

                  // 2. Mock Fallback (Visual Only)
                  const newTokens = Math.max(0, 100 - amount);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true, newTokens }));

                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: error.message }));
                }
              });
              return;
            }

            // Handle /api/verify-payment (SIMULATION for Local Dev)
            if (req.url?.startsWith('/api/verify-payment') && req.method === 'POST') {
              console.log('[Vite Proxy] Handling Payment Verification Locally...');

              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const { paymentId, amount } = JSON.parse(body);

                  // Use environment variables directly in Vite
                  // Support both formats (with and without VITE_ prefix)
                  const keyId = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID;
                  const keySecret = env.RAZORPAY_KEY_SECRET || env.VITE_RAZORPAY_KEY_SECRET;

                  if (!keyId || !keySecret) {
                    console.error('[Vite Proxy] Missing Razorpay Keys in .env');
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Server configuration error: Keys missing in .env. Please check you have VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (or VITE_RAZORPAY_KEY_SECRET).' }));
                    return;
                  }

                  const amountInPaise = Math.round(amount * 100);
                  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

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
                  // Set JSON headers
                  res.setHeader('Content-Type', 'application/json');

                  if (!response.ok) {
                    console.error('[Vite Proxy] Razorpay Capture Error:', data);
                    res.statusCode = response.status;
                    res.end(JSON.stringify({ error: data.error?.description || 'Failed to capture' }));
                    return;
                  }

                  console.log('[Vite Proxy] Payment Captured Successfully:', data.id);

                  // --- PERSISTENCE LOGIC (If Service Account Exists) ---
                  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    try {
                      const admin = await import('firebase-admin');
                      // Init Admin if needed (Reuse singleton check)
                      if (admin.default.apps.length === 0) {
                        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                        admin.default.initializeApp({
                          credential: admin.default.credential.cert(serviceAccount)
                        });
                      }

                      const db = admin.default.firestore();
                      // Determine token amount (match api/verify-payment.js logic)
                      let tokensToCredit = 0;
                      if (amount >= 49 && amount < 60) tokensToCredit = 70;
                      else if (amount >= 99 && amount < 120) tokensToCredit = 150;
                      else if (amount >= 149 && amount < 170) tokensToCredit = 250;
                      else if (amount >= 199) tokensToCredit = 400;

                      if (tokensToCredit > 0) {
                        await db.runTransaction(async (t) => {
                          const userRef = db.collection('users').doc(body.includes('userId') ? JSON.parse(body).userId : 'unknown'); // userId is in the body? check parsing
                          // Re-parse body securely since we streamed it
                          const { userId } = JSON.parse(body);
                          if (!userId) throw new Error("No userId found for credit");

                          const uRef = db.collection('users').doc(userId);
                          t.update(uRef, {
                            tokens: admin.default.firestore.FieldValue.increment(tokensToCredit),
                            isPremium: true,
                            lastPayment: admin.default.firestore.FieldValue.serverTimestamp()
                          });
                        });
                        console.log(`[Vite Proxy] ✅ PERSISTED credit of ${tokensToCredit} tokens for user`);
                      }
                    } catch (err) {
                      console.error("[Vite Proxy] Failed to persist payment credit:", err);
                    }
                  } else {
                    console.log('[Vite Proxy] ℹ️ Service Account missing. Payment is successful but TOKENS WILL NOT PERSIST locally.');
                  }

                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true, payment: data }));

                } catch (error) {
                  console.error('[Vite Proxy] Error:', error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: error.message }));
                }
              });
              return; // Stop processing
            }

            // Existing proxy for fetch-form
            if (req.url?.startsWith('/api/fetch-form')) {
              const urlParams = new URLSearchParams(req.url.split('?')[1]);
              const targetUrl = urlParams.get('url');

              if (!targetUrl) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing URL parameter' }));
                return;
              }

              console.log('[Vite Proxy] Fetching:', targetUrl);
              fetch(targetUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
              })
                .then(async (response) => {
                  if (!response.ok) throw new Error(response.statusText);
                  const text = await response.text();
                  res.statusCode = 200;
                  res.end(text);
                })
                .catch((err) => {
                  console.error('[Vite Proxy] Error:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                });
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) // REMOVED FOR SECURITY
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
