import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Local dev middleware allowing Vite to serve /api/analyze-repo during `npm run dev`
 * using the Web-standard Request/Response handler in api/analyze-repo.ts.
 */
function localApiDevPlugin(): Plugin {
  return {
    name: 'local-api-dev-plugin',
    configureServer(server) {
      // Load environment variables (including .env.local) into process.env for the local API handler
      const env = loadEnv('development', process.cwd(), '');
      for (const [key, val] of Object.entries(env)) {
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.originalUrl || req.url || '';
        if (!rawUrl.startsWith('/api/analyze-repo')) {
          return next();
        }

        try {
          const apiModule = await server.ssrLoadModule('/api/analyze-repo.ts');
          const handler = apiModule.POST;
          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Handler POST not exported from /api/analyze-repo.ts' }));
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
        } catch {
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
