import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json';

/**
 * Vite Configuration with PWA Support
 * * This configuration ensures that:
 * 1. All build assets (JS, CSS, HTML) are automatically precached.
 * 2. The Service Worker updates automatically when a new version is deployed.
 * 3. Static assets in /public are included in the offline cache.
 */
export default defineConfig({
    // Base path for GitHub Pages deployment
    base: './',

    define: {
        '__APP_VERSION__': JSON.stringify(packageJson.version),
    },

    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },

    plugins: [
        VitePWA({
            // 'autoUpdate' ensures the new SW activates immediately, 
            // preventing users from being stuck on old versions.
            registerType: 'autoUpdate',

            // Files in /public to include in the cache
            includeAssets: ['hydrant.svg', 'icon-v3-192.png', 'manifest.json'],

            manifest: false, // We use the existing public/manifest.json, or you can define it here

            workbox: {
                // Critical: This pattern matches the hashed assets Vite generates.
                // Without this, your JS/CSS is NOT cached, and offline mode fails.
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

                // Increase the limit for caching (e.g., Leaflet chunks can be large)
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
            }
        })
    ]
});
