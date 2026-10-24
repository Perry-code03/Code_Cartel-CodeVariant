import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Synchronizes process.env with .env.local without external dependencies or caching issues.
 */
function syncEnvFromFile() {
  const envPath = path.resolve(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
          const key = line.slice(0, eqIdx).trim();
          let val = line.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (key && val) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }
}

/**
 * Local dev middleware allowing Vite to serve /api/* serverless functions during `npm run dev`
 * using the Web-standard Request/Response handlers in api/*.ts.
 */
function localApiDevPlugin(): Plugin {
  return {
    name: 'local-api-dev-plugin',
    configureServer(server) {
      // Initial env sync
      syncEnvFromFile();

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.originalUrl || req.url || '';
        const match = rawUrl.match(/^\/api\/([a-zA-Z0-9_-]+)/);
        if (!match) {
          return next();
        }

        // Dynamically reload environment variables from .env.local on each API call
        syncEnvFromFile();

        const routeName = match[1];
        const endpointFile = `/api/${routeName}.ts`;

        try {
          const apiModule = await server.ssrLoadModule(endpointFile);
          const handler = apiModule[req.method || 'POST'] || apiModule.POST;
          if (typeof handler !== 'function') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Method ${req.method} not allowed on ${endpointFile}` }));
            return;
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const bodyBuffer = Buffer.concat(chunks);

          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host || 'localhost:5173';
          const fullUrl = `${protocol}://${host}${rawUrl}`;

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) {
              if (Array.isArray(value)) {
                value.forEach((v) => headers.append(key, v));
              } else {
                headers.set(key, value);
              }
            }
          }

          const webReq = new Request(fullUrl, {
            method: req.method || 'POST',
            headers,
            body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : bodyBuffer,
          });

          const webRes: Response = await handler(webReq);

          res.statusCode = webRes.status;
          webRes.headers.forEach((val, key) => {
            res.setHeader(key, val);
          });
          const text = await webRes.text();
          res.end(text);
        } catch (err) {
          console.error('[local-api-dev-plugin] Error handling API request:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal error running local dev API handler' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localApiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
