import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = /** @type {(pw: string, salt: Buffer, len: number) => Promise<Buffer>} */ (
  promisify(scrypt)
);

/**
 * @typedef {object} User
 * @property {string} id               Internal account id
 * @property {string} username         Unique, case-insensitive login name
 * @property {string} displayName
 * @property {string} passkeyUserId    Base64URL WebAuthn user handle (random, never PII)
 * @property {string} passwordHash
 *
 * @typedef {object} StoredPasskeyCredential
 * @property {string} id                         Base64URL credential ID
 * @property {string} passkeyUserId              WebAuthn user handle of the owner
 * @property {Uint8Array} publicKey              COSE public key
 * @property {number} counter                    Signature counter (replay detection)
 * @property {string[]} transports
 * @property {'singleDevice' | 'multiDevice'} credentialDeviceType
 * @property {boolean} credentialBackedUp
 * @property {string} aaguid                     UX hint only, never a security signal
 * @property {string} name                       Provider name or user-chosen nickname
 * @property {string | undefined} providerIcon
 * @property {string | undefined} providerIconDark
 * @property {number} registeredAt
 * @property {number | undefined} lastUsedAt
 */

// In-memory store: fine for a playground, swap for a real database in production.
/** @type {Map<string, User>} */
const users = new Map();
/** @type {Map<string, StoredPasskeyCredential>} */
const credentials = new Map();

const normalize = (/** @type {string} */ username) => username.trim().toLowerCase();

export async function hashPassword(/** @type {string} */ password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `${salt.toString('base64url')}.${hash.toString('base64url')}`;
}

export async function verifyPassword(/** @type {string} */ password, /** @type {string} */ stored) {
  const [saltB64, hashB64] = stored.split('.');
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64url'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Dummy hash so failed lookups take as long as real ones (limits username enumeration by timing).
const DUMMY_HASH = await hashPassword(randomUUID());
export const burnPasswordCheck = (/** @type {string} */ password) =>
  verifyPassword(password, DUMMY_HASH);

export const db = {
  /** @param {{ username: string; displayName: string; passwordHash: string }} input */
  createUser({ username, displayName, passwordHash }) {
    if (this.findUserByUsername(username)) return undefined;
    /** @type {User} */
    const user = {
      id: randomUUID(),
      username: normalize(username),
      displayName: displayName.trim() || username.trim(),
      passkeyUserId: randomBytes(32).toString('base64url'),
      passwordHash,
    };
    users.set(user.id, user);
    return user;
  },
  findUserById: (/** @type {string} */ id) => users.get(id),
  findUserByUsername(/** @type {string} */ username) {
    const wanted = normalize(username);
    return [...users.values()].find((u) => u.username === wanted);
  },
  findUserByPasskeyUserId(/** @type {string} */ passkeyUserId) {
    return [...users.values()].find((u) => u.passkeyUserId === passkeyUserId);
  },
  /** @param {string} id @param {{ username?: string; displayName?: string }} patch */
  updateUser(id, patch) {
    const user = users.get(id);
    if (!user) return undefined;
    if (patch.username !== undefined) {
      const clash = this.findUserByUsername(patch.username);
      if (clash && clash.id !== id) return null;
      user.username = normalize(patch.username);
    }
    if (patch.displayName !== undefined) user.displayName = patch.displayName.trim();
    return user;
  },

  saveCredential: (/** @type {StoredPasskeyCredential} */ cred) => void credentials.set(cred.id, cred),
  findCredentialById: (/** @type {string} */ id) => credentials.get(id),
  findCredentialsByPasskeyUserId(/** @type {string} */ passkeyUserId) {
    return [...credentials.values()]
      .filter((c) => c.passkeyUserId === passkeyUserId)
      .sort((a, b) => a.registeredAt - b.registeredAt);
  },
  deleteCredential: (/** @type {string} */ id) => credentials.delete(id),
};

/** Public projection of a user. */
export const toPublicUser = (/** @type {User} */ u) => ({
  username: u.username,
  displayName: u.displayName,
  passkeyUserId: u.passkeyUserId,
});

/** Public projection of a credential (no key material). */
export const toPublicCredential = (/** @type {StoredPasskeyCredential} */ c) => ({
  id: c.id,
  name: c.name,
  providerIcon: c.providerIcon,
  providerIconDark: c.providerIconDark,
  credentialDeviceType: c.credentialDeviceType,
  credentialBackedUp: c.credentialBackedUp,
  transports: c.transports,
  registeredAt: c.registeredAt,
  lastUsedAt: c.lastUsedAt,
});
