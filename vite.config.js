import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Compta/',  // Ajout de la base URL pour GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
