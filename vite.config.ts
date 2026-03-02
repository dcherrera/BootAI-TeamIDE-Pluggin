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
          if (typeof exports !== 'undefined' && BootAIChat && BootAIChat.default) {
            exports.default = BootAIChat.default;
          }
        `,
      },
    },
    minify: false,
    sourcemap: false,
  },
});
