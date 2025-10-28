import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const isDev = process.env.NODE_ENV !== 'production';
let inlineEditPlugin, editModeDevPlugin;

if (isDev) {
  inlineEditPlugin = (
    await import('./plugins/visual-editor/vite-plugin-react-inline-editor.js')
  ).default;
  editModeDevPlugin = (
    await import('./plugins/visual-editor/vite-plugin-edit-mode.js')
  ).default;
}

// Removed insecure error handlers that posed XSS risks
// Error handling is now handled by React Error Boundaries and proper logging

// Do not suppress warnings globally; keep visibility for easier debugging

const logger = createLogger();
const loggerError = logger.error;

logger.error = (msg, options) => {
  if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
    return;
  }

  loggerError(msg, options);
};

export default defineConfig({
  customLogger: logger,
  plugins: [
    ...(isDev ? [inlineEditPlugin(), editModeDevPlugin()] : []),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'images/**/*'],
      manifest: {
        name: 'Ethiopian Maids Platform',
        short_name: 'Ethio Maids',
        description: 'Ethiopian maid service platform connecting domestic workers with families',
        theme_color: '#596acd',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/images/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Cache strategy for runtime
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting for service worker update
        skipWaiting: true,
        // Claim clients immediately
        clientsClaim: true
      }
    })
  ],
  server: {
    cors: true,
    allowedHosts: true,
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Workspace package aliases
      '@ethio-maids/domain-dashboard': path.resolve(__dirname, './packages/domain/dashboard/index.js'),
      '@ethio-maids/domain-profiles': path.resolve(__dirname, './packages/domain/profiles/index.js'),
      '@ethio-maids/app-dashboard-agency': path.resolve(__dirname, './packages/app/dashboard-agency/index.js'),
      '@ethio-maids/app-profiles-agency': path.resolve(__dirname, './packages/app/profiles-agency/index.js'),
      '@ethio-maids/infra-dashboard-agency': path.resolve(__dirname, './packages/infra/dashboard-agency/index.js'),
      '@ethio-maids/infra-profiles-agency': path.resolve(__dirname, './packages/infra/profiles-agency/index.js'),
    },
  },
  build: {
    chunkSizeWarningLimit: 300, // More aggressive size limit
    minify: 'terser',
    target: 'es2020', // Balance between size and compatibility
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        unused: true,
        dead_code: true,
        pure_funcs: ['console.log', 'console.warn', 'console.info'], // Remove more console methods
        passes: 2, // Multiple compression passes
      },
      mangle: {
        safari10: true,
        properties: {
          regex: /^_/, // Mangle private properties
        },
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      external: [
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator',
        '@babel/types',
      ],
      output: {
        // More aggressive chunk splitting for better caching
        manualChunks(id) {
          // Critical vendor chunks - keep these separate and small
          if (id.includes('node_modules')) {
            // React core (should be cached aggressively)
            if (id.includes('react/') && !id.includes('react-dom')) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }

            // Split Radix UI by component for better tree-shaking
            if (id.includes('@radix-ui/react-dialog')) return 'radix-dialog';
            if (id.includes('@radix-ui/react-select')) return 'radix-select';
            if (id.includes('@radix-ui/react-dropdown')) return 'radix-dropdown';
            if (id.includes('@radix-ui/react-toast')) return 'radix-toast';
            if (id.includes('@radix-ui')) return 'radix-misc';

            // Heavy libraries that should be lazy-loaded
            if (id.includes('framer-motion')) return 'animations';
            if (id.includes('recharts')) return 'charts';

            // Icon libraries
            if (id.includes('lucide-react')) return 'icons';

            // Payment/Stripe (only needed in specific flows)
            if (id.includes('@stripe') || id.includes('stripe')) return 'payment';

            // Real-time features (only needed in chat/notifications)
            if (id.includes('socket.io')) return 'realtime';

            // Utilities
            if (id.includes('date-fns')) return 'date-utils';
            if (id.includes('lodash') || id.includes('ramda')) return 'utils';

            // Split large UI libraries for better loading
            if (id.includes('tailwindcss') || id.includes('autoprefixer')) return 'css-vendor';

            // Split data validation/manipulation libraries
            if (id.includes('react-hook-form') || id.includes('yup') || id.includes('zod')) return 'forms';
            if (id.includes('validator') || id.includes('dompurify')) return 'validation';

            // Split bundling-heavy utilities separately
            if (id.includes('classnames') || id.includes('clsx') || id.includes('cva')) return 'css-utils';
            if (id.includes('@supabase')) return 'supabase';

            // Keep only truly miscellaneous, smaller vendor libraries
            return 'vendor-misc';
          }

          // Application chunks - split by feature/route for lazy loading
          if (id.includes('/src/pages/dashboards/')) {
            if (id.includes('MaidDashboard')) return 'maid-dashboard';
            if (id.includes('SponsorDashboard')) return 'sponsor-dashboard';
            if (id.includes('AgencyDashboard')) return 'agency-dashboard';
            return 'dashboards';
          }

          if (id.includes('/src/components/profile/completion/')) {
            if (id.includes('MaidCompletion') || id.includes('UnifiedMaidForm')) return 'maid-forms';
            if (id.includes('SponsorCompletion') || id.includes('UnifiedSponsorForm')) return 'sponsor-forms';
            if (id.includes('AgencyCompletion') || id.includes('AgencyKYBForm')) return 'agency-forms';
            return 'profile-completion';
          }

          // Context providers (loaded early but split for better caching)
          if (id.includes('/src/contexts/AuthContext')) return 'auth-context';
          if (id.includes('/src/contexts/')) return 'contexts';

          // Services (API layer)
          if (id.includes('/src/services/')) {
            if (id.includes('stripe') || id.includes('billing') || id.includes('payment')) return 'payment-services';
            if (id.includes('chat') || id.includes('notification')) return 'realtime-services';
            return 'core-services';
          }

          // UI components (split by usage frequency)
          if (id.includes('/src/components/ui/')) {
            // Heavy UI components that might not be needed immediately
            if (id.includes('DataTable') || id.includes('VideoCV') || id.includes('FileUpload')) return 'heavy-ui';
            return 'ui-components';
          }

          if (id.includes('/src/components/common/')) return 'common-components';

          // Home/Landing page components
          if (id.includes('/src/components/home/')) return 'home-components';

          // Default main chunk (should be kept minimal)
          return 'main';
        },

        // Optimize chunk file naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
  },
});
