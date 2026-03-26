import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
          manifest: {
            name: 'RRF Coral Nursery',
            short_name: 'Coral Nursery',
            description: 'Coral branch nursery management — location, age, health reports, and photo album.',
            theme_color: '#4A90E2',
            background_color: '#FBF9F4',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            // Cache app shell and assets
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            // Don't cache the R2 cloud API calls — always fetch live
            navigateFallback: 'index.html',
            runtimeCaching: [
              {
                // Cache Tailwind CDN
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwind-cdn',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
              {
                // Cache esm.sh dependencies
                urlPattern: /^https:\/\/esm\.sh/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'esm-sh-deps',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 },
                },
              },
              {
                // Network-first for R2 cloud data (always want fresh data when online)
                urlPattern: /\.r2\.cloudflarestorage\.com/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'r2-data',
                  networkTimeoutSeconds: 10,
                },
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
