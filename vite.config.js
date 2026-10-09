import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://www.jiosaavn.com',
        changeOrigin: true,
        secure: false, // Ignore SSL certificate verification issues
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
