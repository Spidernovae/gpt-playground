import { randomBytes } from 'node:crypto';

export const IS_PROD = process.env.NODE_ENV === 'production';
export const PORT = Number(process.env.PORT ?? 5173);

/**
 * Relying Party configuration. RP_ID is a fixed, server-owned constant: it is sent to the
 * client inside every options payload (`rp.id` / `rpId`) so the browser never has to guess it
 * from `window.location.hostname`.
 */
export const RP_ID = process.env.RP_ID ?? 'localhost';
export const RP_NAME = process.env.RP_NAME ?? 'Passkey Playground';
export const ORIGIN = process.env.ORIGIN ?? `http://localhost:${PORT}`;

/** Required user-verification level. Persisted in the session at options time, enforced at verify time. */
export const USER_VERIFICATION = /** @type {'preferred' | 'required'} */ (
  process.env.USER_VERIFICATION ?? 'preferred'
);

/** Window after a password sign-in during which a silent (conditional) passkey creation is allowed. */
export const CONDITIONAL_CREATE_WINDOW_MS = 5 * 60 * 1000;

export const SESSION_SECRET =
  process.env.SESSION_SECRET ??
  (IS_PROD
    ? (() => {
        throw new Error('SESSION_SECRET must be set in production');
      })()
    : randomBytes(32).toString('hex'));
