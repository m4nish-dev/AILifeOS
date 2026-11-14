import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The config file runs in Node, so `import.meta.env` is not available here and
// `process.env` holds only real shell variables. loadEnv() is what reads the
// .env files, so the dev proxy target has to be resolved through it.
//
// The third argument is the key prefix to load. We pass '' to load every key,
// not just VITE_-prefixed ones, so DEV_API_PROXY stays a build-time-only
// setting and is never inlined into the browser bundle.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Falls back to the local Express port so a fresh clone works with no .env.
  const devApiProxy = env.DEV_API_PROXY || 'http://localhost:5001'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      // Dev proxy: forward /api to the Express server defined by DEV_API_PROXY
      // (see .env.development). Proxying server-side means NO CORS in local dev.
      proxy: {
        '/api': {
          target: devApiProxy,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          // Split heavy third-party libraries out of the app bundle. These change
          // far less often than app code, so browsers keep them cached across
          // deploys instead of re-downloading ~900KB every release.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-motion': ['framer-motion'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  }
})
