import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = path.dirname(fileURLToPath(import.meta.url))
const configFile = path.join(frontendRoot, 'config.json')

function sendFile(res, filePath, contentType) {
  res.statusCode = 200
  res.setHeader('Content-Type', contentType)
  res.end(fs.readFileSync(filePath))
}

function bibleLocalAssets() {
  return {
    name: 'bible-local-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url === '/config.json' && fs.existsSync(configFile)) {
          sendFile(res, configFile, 'application/json; charset=utf-8')
          return
        }
        next()
      })
    },
    writeBundle() {
      const dist = path.join(frontendRoot, 'dist')
      if (!fs.existsSync(dist)) {
        return
      }
      if (fs.existsSync(configFile)) {
        fs.copyFileSync(configFile, path.join(dist, 'config.json'))
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), bibleLocalAssets()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5010',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
})
