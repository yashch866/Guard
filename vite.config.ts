import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import path from 'path';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Always use relative paths
  base: './',
  build: {
    // Ensure proper build output for Electron
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure assets are copied to dist
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  publicDir: 'public',
  server: {
    host: "127.0.0.1", // Only listen on localhost
    port: 8080,
    proxy: {
      // Proxy API requests to local backend
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Proxy WebSocket connections
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
