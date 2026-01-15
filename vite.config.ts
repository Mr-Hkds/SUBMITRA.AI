import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';

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
          server.middlewares.use((req, res, next) => {
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
            } else if (req.url?.startsWith('/api/create-payment') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk.toString());
              req.on('end', async () => {
                try {
                  const { amount, currency, notes } = JSON.parse(body);

                  // Get keys
                  const key_id = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
                  const key_secret = process.env.VITE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

                  if (!key_id || !key_secret) {
                    throw new Error('Razorpay keys missing in environment variables');
                  }

                  const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

                  const response = await fetch('https://api.razorpay.com/v1/orders', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Basic ${auth}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      amount,
                      currency: currency || 'INR',
                      receipt: `order_${Date.now()}`,
                      payment_capture: 1, // FORCE AUTO CAPTURE
                      notes: notes || {}
                    })
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(data.error?.description || 'Failed to create order');
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));

                } catch (err: any) {
                  console.error('[Vite Proxy] Payment Error:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            } else if (req.url?.startsWith('/api/verify-payment') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk.toString());
              req.on('end', async () => {
                try {
                  const { orderId, paymentId, signature } = JSON.parse(body);

                  const key_secret = process.env.VITE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

                  if (!key_secret) {
                    throw new Error('Razorpay secret key missing in environment variables');
                  }

                  const generated_signature = crypto
                    .createHmac('sha256', key_secret)
                    .update(orderId + '|' + paymentId)
                    .digest('hex');

                  if (generated_signature === signature) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ valid: true }));
                  } else {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ valid: false, error: 'Invalid signature' }));
                  }
                } catch (err: any) {
                  console.error('[Vite Proxy] Verification Error:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
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
