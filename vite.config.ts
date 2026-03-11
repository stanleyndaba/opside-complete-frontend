import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import path from "path";

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
        // manualChunks removed to prevent Rollup circular dependency OOMs
      },
    },
    chunkSizeWarningLimit: 1000, // Warn for chunks larger than 1MB
    target: 'esnext', // Use modern JS for better performance
    cssCodeSplit: true, // Split CSS for better caching
  },
  plugins: [
    react(),
    // Generate bundle report when running `npm run analyze`
    (process.env.npm_lifecycle_event === 'analyze') && visualizer({
      filename: "dist/bundle-report.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap"
    }),
    // Emit compressed assets for prod preview and easy CDN upload
    // mode === 'production' && viteCompression({ algorithm: 'brotliCompress' }),
    // mode === 'production' && viteCompression({ algorithm: 'gzip' }),
  ].filter(Boolean) as any,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
