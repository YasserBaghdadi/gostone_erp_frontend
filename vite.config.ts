import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import removeConsole from 'vite-plugin-remove-console'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    removeConsole()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'terser', // Use terser for better minification/obfuscation
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log calls
        drop_debugger: true, // Remove debugger statements
      },
      format: {
        comments: false, // Remove all comments
      },
      mangle: true, // Mangle variable names
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui';
            }
            if (id.includes('axios') || id.includes('zod') || id.includes('zustand')) {
              return 'utils';
            }
          }
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api-management.baghdadi.sa',
        changeOrigin: true,
        secure: false,
        
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'https://api-management.gostone.baghdadi.sa',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
