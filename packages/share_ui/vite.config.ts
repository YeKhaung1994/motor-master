import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ShareUi',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'share_ui.js' : 'share_ui.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
        assetFileNames: 'share_ui.[ext]',
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
  css: {
    modules: { generateScopedName: 'mm-[local]-[hash:base64:5]' },
  },
});
