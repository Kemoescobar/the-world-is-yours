import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA : web dashboard installable, pas d'app native (décision figée en spec).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'THE WORLD IS YOURS',
        short_name: 'TWIY',
        theme_color: '#0a1128',
        background_color: '#0a1128',
        display: 'standalone',
      },
    }),
  ],
});
