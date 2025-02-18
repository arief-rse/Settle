import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const commonConfig = {
    plugins: [react()],
    define: {
      'process.env': JSON.stringify(env),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID)
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
          manualChunks: {
            react: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label']
          }
        },
      },
    },
  };
});
