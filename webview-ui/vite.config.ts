import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.tsx',
      name: 'LinearStudioWebview',
      formats: ['iife'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'index.[ext]',
      },
    },
    cssCodeSplit: false,
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
