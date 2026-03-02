import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'BootAIChat',
      fileName: () => 'index.js',
      formats: ['iife'],
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['vue', 'quasar', 'pinia'],
      output: {
        globals: {
          vue: 'Vue',
          quasar: 'Quasar',
          pinia: 'Pinia',
        },
        footer: `
          if (typeof module !== 'undefined' && module.exports) {
            module.exports = BootAIChat;
          }
        `,
      },
    },
    minify: false,
    sourcemap: false,
  },
});
