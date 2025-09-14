import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/teen-budget/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
