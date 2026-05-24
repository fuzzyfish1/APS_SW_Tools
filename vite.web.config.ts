/**
 * Standalone Vite config for the web-only build.
 * Used by:  npm run build:web   (local) and Vercel (CI).
 *
 * Output lands in  <root>/dist/  — matches vercel.json "outputDirectory".
 */
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Treat src/renderer as the project root so index.html is found there
  root: resolve(__dirname, 'src/renderer'),

  plugins: [react()],

  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },

  define: {
    // Inject app version at build time — readable via __APP_VERSION__ in TS
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    __APP_VERSION__: JSON.stringify(require('./package.json').version)
  },

  build: {
    // Output next to the repo root so vercel.json can point at it
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  }
})
