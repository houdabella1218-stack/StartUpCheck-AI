import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    // Écoute sur toutes les interfaces IPv4 (0.0.0.0).
    // Sans cela, Node résout « localhost » en ::1 en priorité et Vite n'écoute
    // qu'en IPv6 : les navigateurs qui se connectent à 127.0.0.1 échouent.
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
