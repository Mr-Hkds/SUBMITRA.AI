import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
