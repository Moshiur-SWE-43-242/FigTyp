import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['jspdf', 'html2canvas', 'qrcode']
  },
  build: {
    chunkSizeWarningLimit: 2000
  }
});