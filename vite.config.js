import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://port-0-backend-mlko1twcac9b9d20.sel3.cloudtype.app',
        changeOrigin: true
      }
    }
  }
})
