import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
export default defineConfig({
  // Serve and build assets under Django's static path for the admin SPA
  base: '/static/admin/',
  plugins: [react()],
  build: {
    outDir: '../static/admin', // output directly into Django's static/admin
    emptyOutDir: true,
  },
})
