export interface User {
  username: string;
  displayName: string;
  passkeyUserId: string;
}

export interface Passkey {
  id: string;
  name: string;
  providerIcon?: string;
  providerIconDark?: string;
  credentialDeviceType: 'singleDevice' | 'multiDevice';
  credentialBackedUp: boolean;
  transports: string[];
  registeredAt: number;
  lastUsedAt?: number;
}

export type RegistrationMode = 'promotion' | 'management' | 'security-key' | 'conditional';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${url}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Network error. Is the server running?', 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

export const api = {
  session: () => request<{ user: User | null }>('GET', '/session'),
  logout: () => request<void>('POST', '/logout'),
  signup: (body: { username: string; displayName: string; password: string }) =>
    request<{ user: User }>('POST', '/signup', body),
  passwordLogin: (body: { username: string; password: string }) =>
    request<{ user: User }>('POST', '/login/password', body),

  registrationOptions: (mode: RegistrationMode) =>
    request<PublicKeyCredentialCreationOptionsJSON>('POST', '/register/options', { mode }),
  registrationVerify: (credential: unknown) =>
    request<{ credential: Passkey }>('POST', '/register/verify', credential),
  loginOptions: () => request<PublicKeyCredentialRequestOptionsJSON>('POST', '/login/options'),
  loginVerify: (credential: unknown) => request<{ user: User }>('POST', '/login/verify', credential),

  credentials: () => request<{ rpId: string; userId: string; credentials: Passkey[] }>('GET', '/credentials'),
  renameCredential: (id: string, name: string) =>
    request<{ credential: Passkey }>('PATCH', `/credentials/${encodeURIComponent(id)}`, { name }),
  deleteCredential: (id: string) => request<void>('DELETE', `/credentials/${encodeURIComponent(id)}`),
  updateUser: (body: { username?: string; displayName?: string }) =>
    request<{ user: User; rpId: string }>('PATCH', '/user', body),
};
