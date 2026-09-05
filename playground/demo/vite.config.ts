import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';

const src = (path: string) => new URL(`../../packages/${path}`, import.meta.url).pathname;

export default defineConfig({
  plugins: [react(), vue()],
  resolve: {
    // Order matters: the `/styles` sub-path entries must win over the bare
    // package names, otherwise they resolve inside index.ts.
    alias: [
      { find: '@i-design/core/styles', replacement: src('core/src/styles/index.css') },
      { find: '@i-design/tokens/tokens.css', replacement: src('tokens/dist/tokens.css') },
      { find: '@i-design/tokens', replacement: src('tokens/src/index.ts') },
      { find: '@i-design/core', replacement: src('core/src/index.ts') },
      { find: '@i-design/react', replacement: src('react/src/index.ts') },
      { find: '@i-design/vue', replacement: src('vue/src/index.ts') },
    ],
  },
});
