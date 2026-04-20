import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path for GitHub Pages project site: https://<user>.github.io/robot-progress/
// Local dev uses '/' so `npm run dev` still works without the prefix.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/robot-progress/' : '/',
}));
