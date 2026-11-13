# passkey-auth

A passkey-first sign-in flow built with Vue 3 and Express. It uses the native WebAuthn browser APIs and verifies on the server with [SimpleWebAuthn](https://simplewebauthn.dev) v14.

```bash
make passkey-auth          # or: yarn workspace passkey-auth dev
# open http://localhost:5173
yarn workspace passkey-auth test   # end-to-end API test (server must be running)
```

`dev` runs one Express process with Vite in middleware mode, so the app and the API share a single origin.

## Flows

| Flow | Where | WebAuthn features used |
| --- | --- | --- |
| **Autofill sign-in** | Sign-in page, username field | Conditional mediation (`mediation: 'conditional'`), `autocomplete="username webauthn"`, discoverable credentials |
| **Button sign-in** | "Sign in with a passkey" | Aborts the pending autofill request first, then re-arms it if the user cancels |
| **Sign-up promotion** | Right after creating an account | `authenticatorAttachment: 'platform'`, `residentKey: 'required'`, `excludeCredentials` |
| **Silent upgrade** | Right after a *password* sign-in | **Conditional create**: `navigator.credentials.create({ mediation: 'conditional' })`; the server relaxes the UP flag only for this one request, which must come within 5 minutes of the password sign-in |
| **Security key** | Account page | WebAuthn **hints** (`hints: ['security-key']`) |
| **Management** | Account page | Rename, delete, profile edit. Provider names and icons come from the **FIDO Convenience MDS** (AAGUID lookup; display only) |
| **Password-manager sync** | Throughout | **Signal API**: `signalUnknownCredential` (server returns 404 or rejects a new passkey), `signalAllAcceptedCredentials` (account page load and after a delete), `signalCurrentUserDetails` (profile rename) |

Feature detection uses `PublicKeyCredential.getClientCapabilities()`. Options and responses go over the wire as JSON via `parseCreationOptionsFromJSON` / `parseRequestOptionsFromJSON` / `credential.toJSON()`. [`webauthn-polyfills`](https://github.com/passkeydeveloper/webauthn-polyfills) fills these in for older browsers. Each Signal API call is feature-detected, and the app skips it where the browser lacks it (Firefox, for example).

## Security notes

- Challenges are stored in the server session and are single-use. The required user-verification level is also kept in the session, so the client can't change it.
- The RP ID is a server constant, and the client always reads it from the options it receives (never from `location.hostname`).
- The session is regenerated on every sign-in. Cookies are `httpOnly` and `SameSite=Lax` (and `Secure` in production). State-changing `/api` requests must carry our own `Origin`.
- Passwords use scrypt with a per-user salt. A failed username lookup still runs a hash, so response timing doesn't reveal which usernames exist.
- **Storage is in memory**, so it resets on restart. Swap `server/db.js` for a real database before using this anywhere real.

## Config (env vars)

`PORT` (5173), `RP_ID` (`localhost`), `RP_NAME`, `ORIGIN` (`http://localhost:$PORT`), `USER_VERIFICATION` (`preferred` | `required`), `SESSION_SECRET` (required in production). Production: `yarn workspace passkey-auth build && yarn workspace passkey-auth start`, served over HTTPS.
