import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: {
        popup: resolve(__dirname, 'src/popup.tsx'),
        content: resolve(__dirname, 'src/content.tsx'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      name: 'TextExtractor',
      formats: ['umd'],
    },
    rollupOptions: {
      external: ['chrome'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          chrome: 'chrome'
        },
        inlineDynamicImports: false,
      },
    },
    target: 'esnext',
    minify: true,
  },
})