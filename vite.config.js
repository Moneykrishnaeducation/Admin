import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import compression from 'vite-plugin-compression';

// ADMIN CONFIG
const ADMIN = {
  base: "/static/admin/",
  plugins: [
    react(),
    tailwindcss(),
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 500 * 1024, deleteOriginalAssets: true }), // Increase threshold to 500 KB
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 500 * 1024, deleteOriginalAssets: true }) // Increase threshold to 500 KB
  ],
  build: {
    outDir: "../static/admin",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: "./index.html",  // Main entry point for Admin
      },
      output: {
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        // Optionally, split vendor code into its own chunk for caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
};

// MANAGER CONFIG
const MANAGER = {
  base: "/static/admin/manager/",
  plugins: [
    react(),
    tailwindcss(), // Add TailwindCSS to the MANAGER config as well
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 500 * 1024, deleteOriginalAssets: true }), // Increase threshold to 500 KB
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 500 * 1024, deleteOriginalAssets: true }) // Increase threshold to 500 KB
  ],
  build: {
    outDir: "../static/admin/manager",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        manager: "./main.html",  // Main entry point for Manager
      },
      output: {
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        // Optionally, split vendor code into its own chunk for caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
};

export default defineConfig(({ mode }) => {
  // Return the appropriate config based on the mode (manager or admin)
  return mode === "manager" ? MANAGER : ADMIN;
});
