import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "src/popup.tsx"),
      name: 'popup',
      formats: ['iife'],
      fileName: () => 'popup.js',
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
