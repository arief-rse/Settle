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
          fileName: 'content',
          formats: ['iife'],
        },
        rollupOptions: {
          output: {
            entryFileNames: '[name].js',
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') return 'content.css';
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
          fileName: 'background',
          formats: ['iife'],
        },
        rollupOptions: {
          output: {
            entryFileNames: '[name].js',
          },
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
          auth: resolve(__dirname, "public/auth.html"),
        },
        output: {
          entryFileNames: '[name].js',
          format: 'es',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'content.css';
            return `assets/${assetInfo.name}`;
          },
          chunkFileNames: 'chunks/[name].[hash].js',
        },
      },
    },
  };
});
