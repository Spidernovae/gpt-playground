import { Router } from 'express';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import {
  CONDITIONAL_CREATE_WINDOW_MS,
  ORIGIN,
  RP_ID,
  RP_NAME,
  USER_VERIFICATION,
} from './config.js';
import {
  burnPasswordCheck,
  db,
  hashPassword,
  toPublicCredential,
  toPublicUser,
  verifyPassword,
} from './db.js';

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 * @typedef {import('./db.js').User} User
 *
 * @typedef {object} AppSession
 * @property {string} [userId]
 * @property {number} [passwordAuthAt]  Set only after a password sign-in (gates conditional create)
 * @property {{ challenge: string; userVerification: string; conditional: boolean }} [registration]
 * @property {{ challenge: string; userVerification: string }} [authentication]
 */

export const router = Router();

const ZERO_AAGUID = '00000000-0000-0000-0000-000000000000';
const MAX_NAME = 64;

/** @param {Request} req */
const sess = (req) => /** @type {import('express-session').Session & AppSession} */ (req.session);

/** Promisified session regeneration: new session id on every privilege change (anti-fixation). */
const regenerate = (/** @type {Request} */ req) =>
  new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve(undefined))));

const cleanString = (/** @type {unknown} */ v, max = MAX_NAME) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/** Credential and user ids must be unpadded Base64URL; the browser Signal API rejects anything else. */
const isBase64Url = (/** @type {unknown} */ v) =>
  typeof v === 'string' && v.length > 0 && v.length % 4 !== 1 && /^[A-Za-z0-9_-]+$/.test(v);

/** @param {Request} req @param {Response} res @param {NextFunction} next */
function requireAuth(req, res, next) {
  const user = sess(req).userId ? db.findUserById(/** @type {string} */ (sess(req).userId)) : undefined;
  if (!user) return void res.status(401).json({ error: 'Not signed in.' });
  res.locals.user = user;
  next();
}

/** @param {Response} res */
const currentUser = (res) => /** @type {User} */ (res.locals.user);

/** Pick a human label for the provider from the FIDO Convenience MDS metadata (UX only). */
function providerDetails(
  /** @type {string} */ aaguid,
  /** @type {import('@simplewebauthn/server').ProviderMetadata | undefined} */ meta,
  /** @type {string[]} */ transports,
) {
  const names = meta?.friendlyNames;
  const name = names && (names.en ?? names['en-US'] ?? Object.values(names)[0]);
  if (aaguid !== ZERO_AAGUID && name) {
    return { name, providerIcon: meta?.icon, providerIconDark: meta?.iconDark };
  }
  const isRoaming = transports.some((t) => ['usb', 'nfc', 'ble'].includes(t));
  return {
    name: isRoaming && !transports.includes('internal') ? 'Security key' : 'Passkey',
    providerIcon: undefined,
    providerIconDark: undefined,
  };
}

// ---------------------------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------------------------

router.get('/session', (req, res) => {
  const user = sess(req).userId ? db.findUserById(/** @type {string} */ (sess(req).userId)) : undefined;
  res.json({ user: user ? toPublicUser(user) : null });
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => (err ? next(err) : res.status(204).end()));
});

// ---------------------------------------------------------------------------------------------
// Account creation + password fallback
// ---------------------------------------------------------------------------------------------

router.post('/signup', async (req, res) => {
  const username = cleanString(req.body?.username);
  const displayName = cleanString(req.body?.displayName);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!/^[a-zA-Z0-9._@+-]{3,64}$/.test(username)) {
    return void res.status(400).json({ error: 'Username must be 3-64 characters: letters, digits, . _ @ + -' });
  }
  if (password.length < 8) {
    return void res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const user = db.createUser({ username, displayName, passwordHash: await hashPassword(password) });
  if (!user) return void res.status(409).json({ error: 'That username is taken.' });

  await regenerate(req);
  sess(req).userId = user.id;
  res.status(201).json({ user: toPublicUser(user) });
});

router.post('/login/password', async (req, res) => {
  const username = cleanString(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = db.findUserByUsername(username);

  const ok = user ? await verifyPassword(password, user.passwordHash) : await burnPasswordCheck(password);
  if (!user || !ok) return void res.status(401).json({ error: 'Incorrect username or password.' });

  await regenerate(req);
  sess(req).userId = user.id;
  sess(req).passwordAuthAt = Date.now();
  res.json({ user: toPublicUser(user) });
});

// ---------------------------------------------------------------------------------------------
// Passkey registration
//   mode: 'promotion'    -> right after sign-up; platform authenticator only
//         'management'   -> from the account page; any authenticator
//         'security-key' -> from the account page; WebAuthn `hints: ['security-key']`
//         'conditional'  -> silent upgrade right after a password sign-in (conditional create)
// ---------------------------------------------------------------------------------------------

router.post('/register/options', requireAuth, async (req, res) => {
  const user = currentUser(res);
  const mode = cleanString(req.body?.mode) || 'management';
  if (!['promotion', 'management', 'security-key', 'conditional'].includes(mode)) {
    return void res.status(400).json({ error: 'Unknown registration mode.' });
  }

  const conditional = mode === 'conditional';
  if (conditional) {
    const at = sess(req).passwordAuthAt;
    if (!at || Date.now() - at > CONDITIONAL_CREATE_WINDOW_MS) {
      return void res.status(403).json({ error: 'Conditional create is only allowed right after a password sign-in.' });
    }
  }

  const existing = db.findCredentialsByPasskeyUserId(user.passkeyUserId);
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: isoBase64URL.toBuffer(user.passkeyUserId),
    userName: user.username,
    userDisplayName: user.displayName,
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.id, transports: c.transports })),
    authenticatorSelection: {
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: USER_VERIFICATION,
      ...((mode === 'promotion' || conditional) && { authenticatorAttachment: 'platform' }),
    },
    ...(mode === 'security-key' && { preferredAuthenticatorType: /** @type {const} */ ('securityKey') }),
  });

  sess(req).registration = { challenge: options.challenge, userVerification: USER_VERIFICATION, conditional };
  res.json(options);
});

router.post('/register/verify', requireAuth, async (req, res) => {
  const user = currentUser(res);
  const pending = sess(req).registration;
  delete sess(req).registration; // challenges are single-use
  if (!pending) return void res.status(400).json({ error: 'No registration in progress.' });

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: pending.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: pending.userVerification === 'required',
      // Conditional create happens without a gesture, so the UP flag may be unset - but ONLY there.
      requireUserPresence: !pending.conditional,
    });
  } catch (err) {
    return void res.status(400).json({ error: `Registration failed: ${/** @type {Error} */ (err).message}` });
  }
  if (!verification.verified) return void res.status(400).json({ error: 'Registration could not be verified.' });

  const info = verification.registrationInfo;
  if (db.findCredentialById(info.credential.id)) {
    return void res.status(409).json({ error: 'This passkey is already registered.' });
  }

  const transports = info.credential.transports ?? [];
  /** @type {import('./db.js').StoredPasskeyCredential} */
  const stored = {
    id: info.credential.id,
    passkeyUserId: user.passkeyUserId,
    publicKey: info.credential.publicKey,
    counter: info.credential.counter,
    transports,
    credentialDeviceType: info.credentialDeviceType,
    credentialBackedUp: info.credentialBackedUp,
    aaguid: info.aaguid,
    ...providerDetails(info.aaguid, info.passkeyProviderMetadata, transports),
    registeredAt: Date.now(),
    lastUsedAt: undefined,
  };
  db.saveCredential(stored);
  if (pending.conditional) delete sess(req).passwordAuthAt; // one silent upgrade per password sign-in

  res.status(201).json({ credential: toPublicCredential(stored) });
});

// ---------------------------------------------------------------------------------------------
// Passkey authentication (discoverable credentials: autofill + button)
// ---------------------------------------------------------------------------------------------

router.post('/login/options', async (req, res) => {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: [], // discoverable: the passkey provider offers its accounts
    userVerification: USER_VERIFICATION,
  });
  sess(req).authentication = { challenge: options.challenge, userVerification: USER_VERIFICATION };
  res.json(options);
});

router.post('/login/verify', async (req, res) => {
  const pending = sess(req).authentication;
  delete sess(req).authentication;
  if (!pending) return void res.status(400).json({ error: 'No sign-in in progress.' });

  const credentialId = req.body?.id;
  const stored = isBase64Url(credentialId) ? db.findCredentialById(credentialId) : undefined;
  // Explicit 404 lets the client call PublicKeyCredential.signalUnknownCredential().
  if (!stored) return void res.status(404).json({ error: 'This passkey is no longer registered with this site.' });

  const user = db.findUserByPasskeyUserId(stored.passkeyUserId);
  if (!user || req.body?.response?.userHandle !== stored.passkeyUserId) {
    return void res.status(401).json({ error: 'Passkey does not match an account.' });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: pending.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: { id: stored.id, publicKey: stored.publicKey, counter: stored.counter, transports: stored.transports },
      requireUserVerification: pending.userVerification === 'required',
    });
  } catch (err) {
    return void res.status(401).json({ error: `Sign-in failed: ${/** @type {Error} */ (err).message}` });
  }
  if (!verification.verified) return void res.status(401).json({ error: 'Sign-in could not be verified.' });

  const info = verification.authenticationInfo;
  stored.counter = info.newCounter;
  stored.credentialBackedUp = info.credentialBackedUp;
  stored.credentialDeviceType = info.credentialDeviceType;
  stored.lastUsedAt = Date.now();
  db.saveCredential(stored);

  await regenerate(req);
  sess(req).userId = user.id;
  res.json({ user: toPublicUser(user) });
});

// ---------------------------------------------------------------------------------------------
// Passkey + account management
// ---------------------------------------------------------------------------------------------

router.get('/credentials', requireAuth, (_req, res) => {
  const user = currentUser(res);
  res.json({
    rpId: RP_ID,
    userId: user.passkeyUserId,
    credentials: db.findCredentialsByPasskeyUserId(user.passkeyUserId).map(toPublicCredential),
  });
});

/** @param {Request} req @param {Response} res */
function ownedCredential(req, res) {
  const cred = db.findCredentialById(String(req.params.id));
  if (!cred || cred.passkeyUserId !== currentUser(res).passkeyUserId) {
    res.status(404).json({ error: 'Passkey not found.' });
    return undefined;
  }
  return cred;
}

router.patch('/credentials/:id', requireAuth, (req, res) => {
  const cred = ownedCredential(req, res);
  if (!cred) return;
  const name = cleanString(req.body?.name);
  if (!name) return void res.status(400).json({ error: 'Name is required.' });
  cred.name = name;
  db.saveCredential(cred);
  res.json({ credential: toPublicCredential(cred) });
});

router.delete('/credentials/:id', requireAuth, (req, res) => {
  const cred = ownedCredential(req, res);
  if (!cred) return;
  db.deleteCredential(cred.id);
  res.status(204).end();
});

router.patch('/user', requireAuth, (req, res) => {
  const user = currentUser(res);
  /** @type {{ username?: string; displayName?: string }} */
  const patch = {};
  if (req.body?.username !== undefined) {
    const username = cleanString(req.body.username);
    if (!/^[a-zA-Z0-9._@+-]{3,64}$/.test(username)) {
      return void res.status(400).json({ error: 'Username must be 3-64 characters: letters, digits, . _ @ + -' });
    }
    patch.username = username;
  }
  if (req.body?.displayName !== undefined) patch.displayName = cleanString(req.body.displayName);

  const updated = db.updateUser(user.id, patch);
  if (updated === null) return void res.status(409).json({ error: 'That username is taken.' });
  res.json({ user: toPublicUser(/** @type {User} */ (updated)), rpId: RP_ID });
});
