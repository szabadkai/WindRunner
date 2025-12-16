import { defineConfig } from 'vite';

export default defineConfig({
  base: '/WindRunner/', // As per tech specs for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
  }
});
