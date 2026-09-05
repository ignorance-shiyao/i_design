import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [react(), vue()],
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@i-design/tokens': new URL('./packages/tokens/src/index.ts', import.meta.url).pathname,
      '@i-design/core': new URL('./packages/core/src/index.ts', import.meta.url).pathname,
      '@i-design/react': new URL('./packages/react/src/index.ts', import.meta.url).pathname,
      '@i-design/vue': new URL('./packages/vue/src/index.ts', import.meta.url).pathname,
    },
  },
});
