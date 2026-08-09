import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),

    /* offline support, F.1.

       the point is not that the whole site works on a train. it is that the
       crisis page does. someone in trouble on a patchy connection should still
       get QLife and 000 out of the app shell, so those routes are precached and
       the rest falls back to the cached shell.

       autoUpdate rather than a prompt, because a "new version available" toast
       is one more thing between somebody and the phone number they came for. */
    VitePWA({
      registerType: 'autoUpdate',
      /* deliberately off for dev. vite serves each module on demand there, so
         there is nothing built to precache, and offline then looks broken when
         it is only untested. build and preview to try it properly. */
      devOptions: { enabled: false },
      includeAssets: ['favicon.ico', 'images/logo-eye.png'],
      manifest: {
        name: 'Iris Health Collective',
        short_name: 'Iris',
        description: 'LGBTIQ+ affirming health services in Victoria',
        theme_color: '#522e63',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/images/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/images/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/images/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpeg,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // map tiles are the one thing worth caching from another origin,
            // so a map you have already looked at still draws offline
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            // firestore is deliberately network only. a stale provider listing
            // or a cached booking would be worse than an honest error
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

