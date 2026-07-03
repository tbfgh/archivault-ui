import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-server port only (this file is never shipped to the browser).
// v2: the '/api' proxy was removed — the app now always calls the API's
// full absolute URL (configured at runtime via the Setup screen) and
// relies on CORS, in dev the same as in production. Set DEV_PORT to run
// multiple frontends against different API instances locally.
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.DEV_PORT) || 3000,
    host: true
  }
})
