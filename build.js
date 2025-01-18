import { build } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Shared config
const sharedConfig = {
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}

// Build configs for each entry point
const configs = [
  {
    ...sharedConfig,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, 'src/popup.tsx'),
        name: 'popup',
        formats: ['iife'],
        fileName: () => 'popup.js',
      },
      rollupOptions: {
        external: ['chrome'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            chrome: 'chrome',
          },
        },
      },
    },
  },
  {
    ...sharedConfig,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/content.tsx'),
        name: 'content',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
      rollupOptions: {
        external: ['chrome'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            chrome: 'chrome',
          },
        },
      },
    },
  },
  {
    ...sharedConfig,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/background.ts'),
        name: 'background',
        formats: ['iife'],
        fileName: () => 'background.js',
      },
      rollupOptions: {
        external: ['chrome'],
        output: {
          globals: {
            chrome: 'chrome',
          },
        },
      },
    },
  },
]

// Build all entry points
async function buildAll() {
  try {
    for (const config of configs) {
      await build(config)
    }
    console.log('Build complete!')
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

buildAll()
