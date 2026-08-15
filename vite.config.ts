import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    // Pin the dev server to 5173 (the origin the backend's CORS expects).
    // strictPort makes Vite fail loudly if 5173 is taken instead of silently
    // hopping to 5174 — which previously caused CORS-blocked auth requests.
    port: 5173,
    strictPort: true,
  },
})
