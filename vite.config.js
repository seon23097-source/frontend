import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/frontend/',  // GitHub Pages용 (repository 이름)
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://class.looool.xyz',
        changeOrigin: true
      }
    }
  }
})
