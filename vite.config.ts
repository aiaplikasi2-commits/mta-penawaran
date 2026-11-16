import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function appVersionFilePlugin(): Plugin {
  const buildVersion = Date.now().toString(36);
  return {
    name: 'app-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: buildVersion }),
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      appVersionFilePlugin(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.png', 'favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'manifest.json'],
        manifest: {
          id: '/',
          name: 'Adm MTA',
          short_name: 'Adm MTA',
          description: 'Aplikasi Administrasi & Operasional HVAC CV. MULIA TEKHNIK ABADI.',
          theme_color: '#0b223d',
          background_color: '#0b223d',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB to cache full offline bundle
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [/^\/api\//, /^\/version\.json$/],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});
