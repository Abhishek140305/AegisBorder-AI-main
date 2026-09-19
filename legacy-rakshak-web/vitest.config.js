import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/engine/__tests__/**/*.test.js'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/engine/'],
      exclude: ['src/engine/__tests__/'],
    },
  },
});
