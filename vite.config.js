import { defineConfig } from 'vite'
import packageJson from './package.json'

export default defineConfig({
    // 'base' handles relative paths correctly for GitHub Pages (e.g. /repo-name/)
    base: './',
    define: {
        '__APP_VERSION__': JSON.stringify(packageJson.version),
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
})
