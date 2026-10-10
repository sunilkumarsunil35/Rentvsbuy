import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works from https://<user>.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: './',
})
