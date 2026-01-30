import { defineConfig } from 'vite'

export default defineConfig({
    // 'base' handles relative paths correctly for GitHub Pages (e.g. /repo-name/)
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
})
