import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // When deployed to GitHub Pages as a project site the app is served under
      // the repository name path (e.g. /Clinical-Code-Editor/). Set `base`
      // so built assets reference the correct absolute path. Keep `/` for dev.
      base: mode === 'production' ? '/Clinical-Code-Editor/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // during development, forward /api requests to the local LLM server
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
            secure: false,
          }
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        , 'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
