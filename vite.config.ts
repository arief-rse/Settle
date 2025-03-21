import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const commonConfig = {
    plugins: [react()],
    define: {
      'process.env': JSON.stringify(env),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  };

  if (mode === 'content') {
    return {
      ...commonConfig,
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
        modules: {
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      },
    };
  }

  if (mode === 'background') {
    return {
      ...commonConfig,
      build: {
        outDir: "dist",
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, "src/background.ts"),
          name: 'background',
          formats: ['iife'],
          fileName: () => 'background.js',
        },
      },
    };
  }

  return {
    ...commonConfig,
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/index.tsx"),
        },
        output: {
          entryFileNames: '[name].js',
          format: 'es',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'index.css') return 'assets/index.css';
            return `assets/${assetInfo.name}`;
          },
          chunkFileNames: 'chunks/[name].[hash].js',
        },
      },
    },
  };
});
