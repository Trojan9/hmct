import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const apiTarget = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // GOV.UK and MoJ Frontend resolve their Sass from node_modules.
        loadPaths: ['.'],
        quietDeps: true,
      },
    },
  },
  server: {
    // Same-origin API calls in development, matching the nginx proxy in production.
    proxy: {
      '/api': apiTarget,
      '/api-docs': apiTarget,
      '/health': apiTarget,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      thresholds: { lines: 85, functions: 85, statements: 85, branches: 80 },
    },
  },
});
