import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy forwards /api and /uploads to the backend, so the browser
// only ever talks to http://localhost:5173 (no CORS problems).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
