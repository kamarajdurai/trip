import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

// Helper to load .env variables into process.env
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {
  console.error('Error loading .env file:', e);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url.startsWith('/api/')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathname = url.pathname;
            
            // Resolve to api/filename.js
            const apiPath = path.join(process.cwd(), pathname + '.js');
            if (fs.existsSync(apiPath)) {
              // Add Vercel helper methods to res
              res.status = (code) => {
                res.statusCode = code;
                return res;
              };
              res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };
 
              // Read and parse request body
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', async () => {
                try {
                  req.body = body ? JSON.parse(body) : {};
                } catch {
                  req.body = body;
                }
 
                try {
                  // Dynamic import with file:// URL for full Windows compatibility
                  const moduleUrl = pathToFileURL(apiPath).href + `?t=${Date.now()}`;
                  const { default: handler } = await import(moduleUrl);
                  await handler(req, res);
                } catch (err) {
                  console.error('API Error:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: `API route ${pathname} not found` }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  /*
  resolve: {
    alias: {
      'firebase/app': path.resolve(process.cwd(), 'src/firebase-mock.js'),
      'firebase/auth': path.resolve(process.cwd(), 'src/firebase-mock.js'),
      'firebase/firestore': path.resolve(process.cwd(), 'src/firebase-mock.js'),
      'firebase/storage': path.resolve(process.cwd(), 'src/firebase-mock.js'),
      'firebase/analytics': path.resolve(process.cwd(), 'src/firebase-mock.js'),
    }
  },
  */
  envPrefix: ['VITE_', 'WEATHER_API_KEY', 'GOOGLE_MAPS_API_KEY'],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
})

