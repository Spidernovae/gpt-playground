import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The dev server runs in middleware mode inside server/index.js so the app and API share one origin.
export default defineConfig({
  plugins: [vue()],
})
