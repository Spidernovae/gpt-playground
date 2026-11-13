import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import { ConvenienceMetadataService } from '@simplewebauthn/server';
import { IS_PROD, ORIGIN, PORT, RP_ID, SESSION_SECRET } from './config.js';
import { router } from './routes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();

app.disable('x-powered-by');
if (IS_PROD) app.set('trust proxy', 1);

app.use(
  session({
    name: 'pk.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: 8 * 60 * 60 * 1000 },
  }),
);

// CSRF guard for the JSON API: state-changing requests must come from our own origin.
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const origin = req.get('origin');
  if (origin !== ORIGIN) return void res.status(403).json({ error: 'Cross-origin request blocked.' });
  next();
});
app.use('/api', express.json({ limit: '64kb' }), router);
app.use('/api', (_req, res) => void res.status(404).json({ error: 'Not found.' }));

if (IS_PROD) {
  const dist = path.join(root, 'dist');
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  // Serve the Vue app through Vite on the same origin as the API, so the WebAuthn origin is single.
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.use(
  /** @type {import('express').ErrorRequestHandler} */
  (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  },
);

// Passkey provider names/icons (Google Password Manager, iCloud Keychain, 1Password, ...) from the
// FIDO Convenience Metadata Service. UX only; registration still works if this download fails.
ConvenienceMetadataService.initialize().catch((err) =>
  console.warn('Passkey provider metadata unavailable:', err.message),
);

app.listen(PORT, () => {
  console.log(`Passkey playground running at ${ORIGIN} (RP ID: ${RP_ID})`);
});
