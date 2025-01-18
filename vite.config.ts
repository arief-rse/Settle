import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    copyPublicDir: true,
    lib: {
      entry: {
        popup: resolve(__dirname, "src/popup.tsx"),
        content: resolve(__dirname, "src/content.tsx"),
        background: resolve(__dirname, "src/background.ts"),
      },
      formats: ['iife'],
      name: 'RectangleReaderBuddy'
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
