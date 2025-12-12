import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from 'vite-plugin-compression'

// ADMIN CONFIG
const ADMIN = {
  base: "/static/admin/",
  plugins: [
    react(),
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 })
  ],
  build: {
    outDir: "../static/admin",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: "./index.html",
      },
    },
  },
};

// MANAGER CONFIG
const MANAGER = {
  base: "/static/admin/manager/",
  plugins: [
    react(),
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 })
  ],
  build: {
    outDir: "../static/admin/manager",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        manager: "./main.html",
      },
    },
  },
};

export default defineConfig(({ mode }) => {
  return mode === "manager" ? MANAGER : ADMIN;
});
