import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Proxy /n8n/* → the VPS in dev so the browser never makes a cross-origin request.
    // VITE_N8N_WEBHOOK_URL should start with /n8n/... in .env (dev) and be the full
    // https://... URL in .env.production.
    proxy: {
      '/n8n': {
        target: 'https://vps-eaf74d37.vps.ovh.ca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n/, ''),
      },
    },
  },
})
