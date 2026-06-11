import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // db.json is the main database file, and we want to ignore it to prevent unnecessary reloads during development
      ignored: ['**/db.json', '**/server/db.json', '**/*.json']
    }
  }
});