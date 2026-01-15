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
                  const keyId = env.VITE_RAZORPAY_KEY_ID;
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
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
