import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// The DJ app (Vikteur/rekord-dj) owns "/" on the same hostname, so this build's
// bundle lives under /guest/ to keep the two asset trees apart. The magic-link
// URL itself stays /g/<token> — nginx serves this index.html for it.
const BASE = '/guest/';

// Where the API (Vikteur/rekord-api) is during `npm run dev`. 8080 is Quarkus's
// default; the e2e harness overrides it to point at a throwaway instance.
const apiTarget = process.env.API_URL ?? `http://127.0.0.1:${process.env.API_PORT ?? '8080'}`;

/**
 * Production nginx answers every /g/<token> with this build's index.html.
 * Do the same in dev, so a real magic link opens against `npm run dev`.
 */
function magicLinkRoute(): Plugin {
  return {
    name: 'guest-magic-link-route',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/g\/[^/?#]+\/?(?:[?#]|$)/.test(req.url)) {
          req.url = `${BASE}index.html`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), magicLinkRoute()],
  server: {
    proxy: {
      '/api': apiTarget,
    },
  },
  // `vite preview` serves the real build; give it the same proxy so a built
  // bundle can be exercised against a local API too.
  preview: {
    proxy: {
      '/api': apiTarget,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
