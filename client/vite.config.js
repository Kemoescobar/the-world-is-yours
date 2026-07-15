import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA : web dashboard installable, pas d'app native (décision figée en spec).
// Ne jamais cacher les appels API (Railway) — sinon Compteurs / Chroniques fantômes hors réseau.
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
      workbox: {
        navigateFallbackDenylist: [/^\/api/, /\/health$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api') || /\/api\//.test(url.href),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url }) => url.pathname === '/health' || url.href.includes('/health'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
});
