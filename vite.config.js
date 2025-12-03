import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Read Vite build mode from command line (NOT env)
const modeArg = process.argv.find(arg => arg.startsWith("--mode="));
const MODE = modeArg ? modeArg.split("=")[1] : "admin";

// ADMIN CONFIG
const ADMIN = {
  base: "/static/admin/",
  plugins: [react()],
  build: {
    outDir: "../static/admin",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        admin: "./index.html",
      },
    },
  },
};

// MANAGER CONFIG
const MANAGER = {
  base: "/static/admin/manager/",
  plugins: [react()],
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

export default defineConfig(MODE === "manager" ? MANAGER : ADMIN);
