/**
 * End-to-end smoke test of the passkey API using an in-process software authenticator.
 * Start the server first (`yarn workspace passkey-auth dev`), then run `yarn workspace passkey-auth test`.
 */
import assert from 'node:assert/strict';
import { createHash, createSign, generateKeyPairSync, randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { isoCBOR } from '@simplewebauthn/server/helpers';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const RP_ID = process.env.RP_ID ?? 'localhost';
const b64u = (/** @type {Uint8Array} */ buf) => Buffer.from(buf).toString('base64url');
const sha256 = (/** @type {Uint8Array | string} */ d) => createHash('sha256').update(d).digest();

/** Minimal HTTP client with a cookie jar for one session. */
function client() {
  let cookie = '';
  return async (/** @type {string} */ method, /** @type {string} */ path, body, origin = BASE) => {
    const res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        ...(cookie && { cookie }),
        ...(method !== 'GET' && { origin }),
        ...(body !== undefined && { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : undefined };
  };
}

/** A software platform authenticator holding one ES256 passkey. */
function authenticator() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const credId = randomBytes(16);
  let counter = 0;
  let userHandle = '';

  const flags = ({ up = true, uv = true, at = false }) =>
    (up ? 0x01 : 0) | (uv ? 0x04 : 0) | 0x08 /* BE */ | 0x10 /* BS */ | (at ? 0x40 : 0);
  const counterBytes = () => {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(counter);
    return b;
  };

  return {
    id: b64u(credId),
    create(/** @type {any} */ options, { up = true } = {}) {
      userHandle = options.user.id;
      const cose = new Map([
        [1, 2],
        [3, -7],
        [-1, 1],
        [-2, Buffer.from(/** @type {string} */ (jwk.x), 'base64url')],
        [-3, Buffer.from(/** @type {string} */ (jwk.y), 'base64url')],
      ]);
      const idLen = Buffer.alloc(2);
      idLen.writeUInt16BE(credId.length);
      const authData = Buffer.concat([
        sha256(options.rp.id),
        Buffer.from([flags({ up, at: true })]),
        counterBytes(),
        Buffer.alloc(16), // zeroed AAGUID
        idLen,
        credId,
        Buffer.from(isoCBOR.encode(/** @type {any} */ (cose))),
      ]);
      const attestationObject = isoCBOR.encode(
        /** @type {any} */ (new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]])),
      );
      const clientDataJSON = JSON.stringify({ type: 'webauthn.create', challenge: options.challenge, origin: BASE, crossOrigin: false });
      return {
        id: b64u(credId),
        rawId: b64u(credId),
        type: 'public-key',
        authenticatorAttachment: 'platform',
        clientExtensionResults: {},
        response: {
          clientDataJSON: b64u(Buffer.from(clientDataJSON)),
          attestationObject: b64u(attestationObject),
          transports: ['internal', 'hybrid'],
        },
      };
    },
    get(/** @type {any} */ options) {
      counter++;
      const authData = Buffer.concat([sha256(options.rpId), Buffer.from([flags({})]), counterBytes()]);
      const clientDataJSON = Buffer.from(
        JSON.stringify({ type: 'webauthn.get', challenge: options.challenge, origin: BASE, crossOrigin: false }),
      );
      const signature = createSign('sha256')
        .update(Buffer.concat([authData, sha256(clientDataJSON)]))
        .sign(privateKey);
      return {
        id: b64u(credId),
        rawId: b64u(credId),
        type: 'public-key',
        authenticatorAttachment: 'platform',
        clientExtensionResults: {},
        response: {
          clientDataJSON: b64u(clientDataJSON),
          authenticatorData: b64u(authData),
          signature: b64u(signature),
          userHandle,
        },
      };
    },
  };
}

const username = `alice${Date.now()}`;
const password = 'correct horse battery';
const device = authenticator();

test('sign up, then register a passkey (promotion flow)', async () => {
  const api = client();
  const signup = await api('POST', '/signup', { username, displayName: 'Alice', password });
  assert.equal(signup.status, 201);

  const opts = await api('POST', '/register/options', { mode: 'promotion' });
  assert.equal(opts.status, 200);
  assert.equal(opts.body.rp.id, RP_ID);
  assert.equal(opts.body.authenticatorSelection.residentKey, 'required');
  assert.equal(opts.body.authenticatorSelection.authenticatorAttachment, 'platform');

  const attestation = device.create(opts.body);
  const verify = await api('POST', '/register/verify', attestation);
  assert.equal(verify.status, 201, JSON.stringify(verify.body));
  assert.equal(verify.body.credential.id, device.id);
  assert.equal(verify.body.credential.credentialBackedUp, true);

  const replay = await api('POST', '/register/verify', attestation);
  assert.equal(replay.status, 400, 'registration challenge must be single-use');
});

test('sign in with a discoverable passkey', async () => {
  const api = client();
  const opts = await api('POST', '/login/options');
  assert.equal(opts.body.rpId, RP_ID);
  assert.deepEqual(opts.body.allowCredentials, []);

  const assertion = device.get(opts.body);
  const verify = await api('POST', '/login/verify', assertion);
  assert.equal(verify.status, 200, JSON.stringify(verify.body));
  assert.equal(verify.body.user.username, username);

  const replay = await api('POST', '/login/verify', assertion);
  assert.equal(replay.status, 400, 'authentication challenge must be single-use');

  const list = await api('GET', '/credentials');
  assert.equal(list.body.rpId, RP_ID);
  assert.equal(list.body.credentials.length, 1);
  assert.ok(list.body.credentials[0].lastUsedAt);
  assert.equal(list.body.credentials[0].publicKey, undefined, 'never expose key material');

  const conditional = await api('POST', '/register/options', { mode: 'conditional' });
  assert.equal(conditional.status, 403, 'conditional create requires a recent password sign-in');
});

test('unknown credential returns 404 (client then calls signalUnknownCredential)', async () => {
  const api = client();
  const opts = await api('POST', '/login/options');
  const stranger = authenticator();
  stranger.create({ user: { id: 'AAAA' }, rp: { id: RP_ID }, challenge: 'x' });
  const res = await api('POST', '/login/verify', stranger.get(opts.body));
  assert.equal(res.status, 404);
});

test('password sign-in allows exactly one conditional create (UP not required)', async () => {
  const api = client();
  assert.equal((await api('POST', '/login/password', { username, password: 'wrong-password' })).status, 401);
  assert.equal((await api('POST', '/login/password', { username, password })).status, 200);

  const second = authenticator();
  const opts = await api('POST', '/register/options', { mode: 'conditional' });
  assert.equal(opts.status, 200);
  assert.deepEqual(opts.body.excludeCredentials.map((/** @type {any} */ c) => c.id), [device.id]);
  const verify = await api('POST', '/register/verify', second.create(opts.body, { up: false }));
  assert.equal(verify.status, 201, JSON.stringify(verify.body));

  const again = await api('POST', '/register/options', { mode: 'conditional' });
  assert.equal(again.status, 403);
});

test('explicit registration still requires user presence', async () => {
  const api = client();
  await api('POST', '/login/password', { username, password });
  const opts = await api('POST', '/register/options', { mode: 'management' });
  const res = await api('POST', '/register/verify', authenticator().create(opts.body, { up: false }));
  assert.equal(res.status, 400);
});

test('security-key mode sends WebAuthn hints', async () => {
  const api = client();
  await api('POST', '/login/password', { username, password });
  const opts = await api('POST', '/register/options', { mode: 'security-key' });
  assert.deepEqual(opts.body.hints, ['security-key']);
});

test('cross-origin writes are rejected', async () => {
  const api = client();
  const res = await api('POST', '/login/password', { username, password }, 'https://evil.example');
  assert.equal(res.status, 403);
});

test('rename, profile update, delete', async () => {
  const api = client();
  await api('POST', '/login/password', { username, password });

  const renamed = await api('PATCH', `/credentials/${device.id}`, { name: 'Work laptop' });
  assert.equal(renamed.body.credential.name, 'Work laptop');

  const profile = await api('PATCH', '/user', { displayName: 'Alice Liddell' });
  assert.equal(profile.body.user.displayName, 'Alice Liddell');
  assert.equal(profile.body.rpId, RP_ID);

  assert.equal((await api('DELETE', `/credentials/${device.id}`)).status, 204);
  const opts = await api('POST', '/login/options');
  assert.equal((await api('POST', '/login/verify', device.get(opts.body))).status, 404);
});
