/**
 * Native WebAuthn client helpers (no client-side wrapper library).
 *
 * Uses: PublicKeyCredential.getClientCapabilities(), parse{Creation,Request}OptionsFromJSON(),
 * PublicKeyCredential#toJSON(), conditional mediation for both get (autofill) and create (silent
 * upgrade), WebAuthn hints, and the Signal API to keep password managers in sync with the server.
 * `webauthn-polyfills` (imported in main.ts) back-fills the JSON + capability methods.
 */
import { api, ApiError, type Passkey, type RegistrationMode, type User } from './api';

/** Signal API isn't in TypeScript's DOM lib yet; every method is feature-detected before use. */
interface SignalAPI {
  signalUnknownCredential?(o: { rpId: string; credentialId: string }): Promise<void>;
  signalAllAcceptedCredentials?(o: { rpId: string; userId: string; allAcceptedCredentialIds: string[] }): Promise<void>;
  signalCurrentUserDetails?(o: { rpId: string; userId: string; name: string; displayName: string }): Promise<void>;
}
const signals = (): SignalAPI =>
  'PublicKeyCredential' in window ? (PublicKeyCredential as unknown as SignalAPI) : {};

export type Capabilities = Partial<Record<string, boolean>>;

let capabilitiesPromise: Promise<Capabilities> | undefined;
/** Cached `getClientCapabilities()`; resolves to `{}` where WebAuthn is unavailable. */
export function getCapabilities(): Promise<Capabilities> {
  capabilitiesPromise ??= (async () => {
    if (!window.isSecureContext || !('PublicKeyCredential' in window)) return {};
    try {
      return (await PublicKeyCredential.getClientCapabilities()) as Capabilities;
    } catch {
      return {};
    }
  })();
  return capabilitiesPromise;
}

const isBase64Url = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length % 4 !== 1 && /^[A-Za-z0-9_-]+$/.test(v);

async function signalUnknownCredential(rpId: string | undefined, credentialId: string) {
  const s = signals();
  if (!s.signalUnknownCredential || !rpId || !isBase64Url(credentialId)) return;
  try {
    await s.signalUnknownCredential({ rpId, credentialId });
  } catch (e) {
    console.warn('signalUnknownCredential failed:', e);
  }
}

export async function signalAcceptedCredentials(rpId: string, userId: string, credentials: Passkey[]) {
  const s = signals();
  const ids = credentials.map((c) => c.id);
  if (!s.signalAllAcceptedCredentials || !rpId || !isBase64Url(userId) || !ids.every(isBase64Url)) return;
  try {
    await s.signalAllAcceptedCredentials({ rpId, userId, allAcceptedCredentialIds: ids });
  } catch (e) {
    console.warn('signalAllAcceptedCredentials failed:', e);
  }
}

export async function signalUserDetails(rpId: string, user: User) {
  const s = signals();
  if (!s.signalCurrentUserDetails || !rpId || !isBase64Url(user.passkeyUserId)) return;
  try {
    await s.signalCurrentUserDetails({
      rpId,
      userId: user.passkeyUserId,
      name: user.username,
      displayName: user.displayName,
    });
  } catch (e) {
    console.warn('signalCurrentUserDetails failed:', e);
  }
}

/** Thrown for outcomes the UI should show; user cancellations resolve to `null` instead. */
export class PasskeyError extends Error {}

// ---------------------------------------------------------------------------------------------
// Sign-in
// ---------------------------------------------------------------------------------------------

async function finishSignIn(credential: PublicKeyCredential, rpId: string | undefined): Promise<User> {
  const encoded = credential.toJSON();
  try {
    return (await api.loginVerify(encoded)).user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // The server deleted this passkey: ask the password manager to hide/remove it.
      await signalUnknownCredential(rpId, encoded.id);
    }
    throw err;
  }
}

/**
 * Conditional UI: arm passkey suggestions in the username field's autofill dropdown.
 * Resolves with the user when they pick a passkey, or `null` if aborted/unsupported.
 */
export async function startAutofillSignIn(signal: AbortSignal): Promise<User | null> {
  const caps = await getCapabilities();
  if (caps.conditionalGet !== true || signal.aborted) return null;

  const publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(await api.loginOptions());
  if (signal.aborted) return null;

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.get({ publicKey, signal, mediation: 'conditional' });
  } catch (err) {
    if (err instanceof DOMException && ['NotAllowedError', 'AbortError'].includes(err.name)) return null;
    throw err;
  }
  if (!credential) return null;
  return finishSignIn(credential as PublicKeyCredential, publicKey.rpId);
}

/** Explicit "Sign in with a passkey" button. Resolves `null` when the user cancels. */
export async function signInWithPasskey(signal?: AbortSignal): Promise<User | null> {
  if (!('PublicKeyCredential' in window)) throw new PasskeyError('This browser does not support passkeys.');
  const publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(await api.loginOptions());

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.get({ publicKey, signal });
  } catch (err) {
    if (err instanceof DOMException && ['NotAllowedError', 'AbortError'].includes(err.name)) return null;
    throw err;
  }
  if (!credential) return null;
  return finishSignIn(credential as PublicKeyCredential, publicKey.rpId);
}

// ---------------------------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------------------------

async function finishRegistration(credential: PublicKeyCredential, rpId: string | undefined): Promise<Passkey> {
  const encoded = credential.toJSON();
  try {
    return (await api.registrationVerify(encoded)).credential;
  } catch (err) {
    // The authenticator saved a passkey the server rejected: tell the provider it's orphaned.
    await signalUnknownCredential(rpId, encoded.id);
    throw err;
  }
}

/** Explicit passkey creation (post-sign-up promotion, or from the account page). `null` = cancelled. */
export async function registerPasskey(mode: Exclude<RegistrationMode, 'conditional'>): Promise<Passkey | null> {
  if (!('PublicKeyCredential' in window)) throw new PasskeyError('This browser does not support passkeys.');
  const publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(await api.registrationOptions(mode));

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.create({ publicKey });
  } catch (err) {
    if (!(err instanceof DOMException)) throw err;
    switch (err.name) {
      case 'NotAllowedError':
      case 'AbortError':
        return null;
      case 'InvalidStateError':
        throw new PasskeyError('A passkey for this account already exists in that passkey provider.');
      case 'SecurityError':
        throw new PasskeyError('Passkeys need HTTPS (or localhost) and a matching RP ID.');
      default:
        throw err;
    }
  }
  if (!credential) return null;
  return finishRegistration(credential as PublicKeyCredential, publicKey.rp.id);
}

/**
 * Conditional create: after a password sign-in, ask the password manager to silently add a
 * passkey for the account it just autofilled. No UI, no errors surfaced; resolves `null` if the
 * browser or provider declines.
 */
export async function tryConditionalCreate(): Promise<Passkey | null> {
  const caps = await getCapabilities();
  if (caps.conditionalCreate !== true) return null;

  let publicKey: PublicKeyCredentialCreationOptions;
  try {
    publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(await api.registrationOptions('conditional'));
  } catch {
    return null;
  }

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.create({
      publicKey,
      mediation: 'conditional',
    } as CredentialCreationOptions);
  } catch (err) {
    if (err instanceof DOMException && ['InvalidStateError', 'NotAllowedError', 'AbortError'].includes(err.name)) {
      return null;
    }
    console.warn('Conditional create failed:', err);
    return null;
  }
  if (!credential) return null;
  try {
    return await finishRegistration(credential as PublicKeyCredential, publicKey.rp.id);
  } catch (err) {
    console.warn('Conditional create verification failed:', err);
    return null;
  }
}
