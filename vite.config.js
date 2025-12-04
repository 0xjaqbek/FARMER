import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Custom PWA plugin with development fixes
const pwaPlugin = (isDev) => {
  return {
    name: 'pwa',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// Service worker will be copied from public/sw.js`
      });
    },
    configureServer(server) {
      // Only serve service worker in production preview
      if (!isDev) {
        server.middlewares.use('/sw.js', (req, res, next) => {
          if (req.url === '/sw.js') {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Service-Worker-Allowed', '/');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
          next();
        });
      }
    }
  };
};

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

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  const isProd = mode === 'production';
  
  return {
    plugins: [
      react(),
      pwaPlugin(isDev)
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'utils': ['date-fns', 'zod']
          },
          
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
      
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      cssSourcemap: false
    },
    
    // FIXED: Development server configuration
    server: {
      port: 3000,
      strictPort: false, // Allow fallback ports
      host: '127.0.0.1', // More specific than true
      
      // FIXED: HMR configuration
      hmr: {
        port: 3001,
        host: '127.0.0.1', // Match server host
        protocol: 'ws', // Explicit protocol
        clientPort: 3001, // Ensure client connects to correct port
      },
      
      // Development headers
      headers: {
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent dev caching
      },
      
      // Force dependency optimization
      force: true,
      
      // Clear cache on restart
      clearScreen: false
    },
    
    preview: {
      port: 4173,
      strictPort: true,
      host: true,
      headers: {
        'Service-Worker-Allowed': '/'
      }
    },
    
    define: {
      __APP_VERSION__: JSON.stringify(packageVersion),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: JSON.stringify(isDev),
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom'
      ],
      exclude: [],
      // Force optimization on restart
      force: true
    },
    
    publicDir: 'public',
    assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],
    
    css: {
      devSourcemap: false,
      preprocessorOptions: {}
    },
    
    // FIXED: Explicit handling for development
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : []
    }
  };
});