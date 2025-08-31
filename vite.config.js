import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url'

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// Custom PWA plugin to handle service worker and manifest
const pwaPlugin = () => {
  return {
    name: 'pwa',
    generateBundle() {
      // Ensure service worker is included in build
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// Service worker will be copied from public/sw.js`
      });
    },
    configureServer(server) {
      // Serve service worker during development
      server.middlewares.use('/sw.js', (req, res, next) => {
        if (req.url === '/sw.js') {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Service-Worker-Allowed', '/');
        }
        next();
      });
    }
  };
};

// Read package.json for version
let packageVersion = '1.0.0';
try {
  const packageJson = JSON.parse(
    await import('fs').then(fs => 
      fs.readFileSync('./package.json', 'utf8')
    )
  );
  packageVersion = packageJson.version || '1.0.0';
} catch {
  console.warn('Could not read package.json version, using default:', packageVersion);
}

export default defineConfig({
  plugins: [
    react(),
    pwaPlugin()
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // PWA-specific build optimizations
  build: {
    target: 'esnext', // Use latest target to support all modern features
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable for production
    minify: 'esbuild',
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'utils': ['date-fns', 'zod']
        },
        
        // Consistent chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '') 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    
    // Enable asset inlining for small files
    assetsInlineLimit: 4096,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Disable CSS source maps in production
    cssSourcemap: false
  },
  
  // Development server configuration
  server: {
    port: 3000,
    strictPort: true,
    host: true, // Allow external connections
    hmr: {
    port: 3001, // Use different port for HMR
    },
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  
  // Preview server (for testing PWA)
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  
  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ],
    exclude: []
  },
  
  // PWA manifest handling
  publicDir: 'public',
  
  // Asset processing
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],
  
  // CSS preprocessing
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      // Add any CSS preprocessor options here
    }
  }
});