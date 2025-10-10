import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      	"/api": {
      		target: process.env.VITE_API_BASE_URL || "http://localhost:3000",
      		changeOrigin: true,
      		secure: false,
      		rewrite: (path) => path.replace(/^\/api/, "/api"),
      	},
    },
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
