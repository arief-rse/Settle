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
      entry: resolve(__dirname, "src/content.tsx"),
      name: 'content',
      formats: ['iife'],
      fileName: () => 'content.js',
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
