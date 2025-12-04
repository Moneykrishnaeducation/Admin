import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ADMIN CONFIG
const ADMIN = {
  base: "/static/admin/",
  plugins: [react()],
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

export default defineConfig(({ mode }) => {
  return mode === "manager" ? MANAGER : ADMIN;
});
