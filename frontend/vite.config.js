import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, rootDir, '')
  const hasExplicitApiUrl = Boolean(env.VITE_API_URL?.trim())

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: hasExplicitApiUrl
        ? undefined
        : {
            '/api': {
              target: 'http://localhost:4000',
              changeOrigin: true,
            },
          },
    },
  }
})
