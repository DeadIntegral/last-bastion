import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Phaser ships as one large module. It is isolated and lazy-loaded; this limit keeps
    // the size warning focused on accidental growth in the smaller application chunks.
    chunkSizeWarningLimit: 1250,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'phaser', test: /node_modules[\\/]phaser/, priority: 30 },
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler|zustand)/, priority: 20 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
