import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Development proxy - route /api calls to local backend
    // This eliminates CORS issues and simplifies development
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // Log proxy requests in development for debugging
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
          });
          proxy.on('error', (err, req) => {
            console.error(`[Proxy] Error for ${req.url}:`, err.message);
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Keep React and ReactDOM together to avoid timing issues
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-is')) {
            return 'react-vendor';
          }

          if (id.includes('react-router')) return 'react-router';
          if (id.includes('@tanstack')) return 'tanstack';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('recharts')) return 'recharts';
          if (id.includes('date-fns')) return 'date-fns';
          if (id.includes('zod')) return 'zod';
          if (id.includes('cmdk')) return 'cmdk';

          // leave the rest to be split per entry to avoid a monolithic vendor
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Warn for chunks larger than 1MB
    target: 'esnext', // Use modern JS for better performance
    cssCodeSplit: true, // Split CSS for better caching
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Generate bundle report when running `npm run analyze`
    (process.env.npm_lifecycle_event === 'analyze') && visualizer({
      filename: "dist/bundle-report.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap"
    }),
    // Emit compressed assets for prod preview and easy CDN upload
    mode === 'production' && viteCompression({ algorithm: 'brotliCompress' }),
    mode === 'production' && viteCompression({ algorithm: 'gzip' }),
  ].filter(Boolean) as any,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
