import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // listens on all local network addresses
    port: 80,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

