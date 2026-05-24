import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('./package.json')

export default defineConfig({
  main: {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    }
  }
})
