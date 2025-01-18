import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  if (mode === 'content') {
    return {
      plugins: [react()],
      build: {
        outDir: "dist",
        emptyOutDir: false,
        minify: 'esbuild',
        cssMinify: true,
        lib: {
          entry: resolve(__dirname, "src/content.tsx"),
          name: 'content',
          formats: ['iife'],
          fileName: () => 'content.js',
        },
        rollupOptions: {
          output: {
            extend: true,
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') return 'style.css';
              return `assets/${assetInfo.name}`;
            },
          },
        },
      },
      css: {
        // Generate a single CSS file
        modules: {
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      },
      resolve: {
        alias: {
          "@": resolve(__dirname, "./src"),
        },
      },
    };
  }

  if (mode === 'background') {
    return {
      plugins: [react()],
      build: {
        outDir: "dist",
        emptyOutDir: false,
        minify: 'esbuild',
        cssMinify: true,
        lib: {
          entry: resolve(__dirname, "src/background.ts"),
          name: 'background',
          formats: ['iife'],
          fileName: () => 'background.js',
        },
      },
      resolve: {
        alias: {
          "@": resolve(__dirname, "./src"),
        },
      },
    };
  }

  // Default mode for popup
  return {
    plugins: [react()],
    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/index.tsx"),
        },
        output: {
          entryFileNames: '[name].js',
          format: 'es',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'style.css';
            return `assets/${assetInfo.name}`;
          },
          chunkFileNames: 'chunks/[name].[hash].js',
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  };
});
