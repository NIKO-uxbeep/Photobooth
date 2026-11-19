import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/Photobooth/' : '/',
  plugins: [react()],
  server: { port: 8080 },
  preview: { port: 8080 },
}));