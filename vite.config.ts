import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['phaser'],
  },
  server: {
    host: true,
    port: 5173,
  },
});
