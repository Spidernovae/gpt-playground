<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api, type Passkey, type User } from '../lib/api'
import { getCapabilities, registerPasskey, signalAcceptedCredentials, signalUserDetails } from '../lib/webauthn'
import { errorMessage } from '../lib/errors'

const props = defineProps<{ user: User; passkeysVersion: number }>()
const emit = defineEmits<{ 'user-updated': [user: User]; 'signed-out': [] }>()

const passkeys = ref<Passkey[]>([])
const loaded = ref(false)
const busy = ref(false)
const error = ref('')
const status = ref('')
const canCreatePasskey = ref(false)
const renamingId = ref<string | null>(null)
const renameValue = ref('')
const editingProfile = ref(false)
const profile = ref({ username: '', displayName: '' })

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** Reload the list and tell the password manager which passkeys the server still accepts. */
async function loadPasskeys() {
  try {
    const { rpId, userId, credentials } = await api.credentials()
    passkeys.value = credentials
    loaded.value = true
    void signalAcceptedCredentials(rpId, userId, credentials)
  } catch (err) {
    error.value = errorMessage(err)
  }
}

async function run(task: () => Promise<void>) {
  busy.value = true
  error.value = ''
  status.value = ''
  try {
    await task()
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    busy.value = false
  }
}

const addPasskey = (mode: 'management' | 'security-key') =>
  run(async () => {
    const passkey = await registerPasskey(mode)
    if (!passkey) return
    status.value = `Added ${passkey.name}.`
    await loadPasskeys()
  })

function startRename(p: Passkey) {
  renamingId.value = p.id
  renameValue.value = p.name
}

const saveRename = (p: Passkey) =>
  run(async () => {
    await api.renameCredential(p.id, renameValue.value) // label only; no Signal API call needed
    renamingId.value = null
    await loadPasskeys()
  })

const removePasskey = (p: Passkey) =>
  run(async () => {
    if (!confirm(`Remove "${p.name}"? You won't be able to sign in with it any more.`)) return
    await api.deleteCredential(p.id)
    status.value = `Removed ${p.name}.`
    await loadPasskeys() // also signals the remaining IDs so the provider hides the deleted one
  })

function startProfileEdit() {
  profile.value = { username: props.user.username, displayName: props.user.displayName }
  editingProfile.value = true
}

const saveProfile = () =>
  run(async () => {
    const { user, rpId } = await api.updateUser(profile.value)
    editingProfile.value = false
    emit('user-updated', user)
    status.value = 'Profile updated.'
    void signalUserDetails(rpId, user) // keeps the name shown in passkey pickers in sync
  })

const signOut = () =>
  run(async () => {
    await api.logout()
    emit('signed-out')
  })

onMounted(async () => {
  const caps = await getCapabilities()
  canCreatePasskey.value = caps.passkeyPlatformAuthenticator === true
  await loadPasskeys()
})
watch(() => props.passkeysVersion, loadPasskeys)
</script>

<template>
  <section class="card" aria-labelledby="account-heading">
    <div class="row" style="justify-content: space-between">
      <h1 id="account-heading">Hi, {{ user.displayName || user.username }}</h1>
      <button type="button" :disabled="busy" @click="signOut">Sign out</button>
    </div>

    <form v-if="editingProfile" style="margin-top: 1rem" @submit.prevent="saveProfile">
      <label>
        Username
        <input v-model="profile.username" autocomplete="username" required minlength="3" maxlength="64" />
      </label>
      <label>
        Display name
        <input v-model="profile.displayName" autocomplete="name" maxlength="64" />
      </label>
      <div class="row">
        <button type="submit" class="primary" :disabled="busy">Save</button>
        <button type="button" @click="editingProfile = false">Cancel</button>
      </div>
    </form>
    <p v-else class="muted" style="margin: 0.25rem 0 0">
      Signed in as <strong>{{ user.username }}</strong> ·
      <button type="button" class="link" @click="startProfileEdit">Edit profile</button>
    </p>
  </section>

  <section class="card" aria-labelledby="passkeys-heading">
    <h2 id="passkeys-heading">Passkeys</h2>

    <p v-if="error" class="alert error" role="alert">{{ error }}</p>
    <p v-if="status" class="alert success" role="status">{{ status }}</p>

    <p v-if="loaded && passkeys.length === 0" class="muted">
      No passkeys yet. Add one to sign in without your password.
    </p>

    <ul class="passkeys">
      <li v-for="p in passkeys" :key="p.id" class="passkey">
        <picture v-if="p.providerIcon">
          <source v-if="p.providerIconDark" :srcset="p.providerIconDark" media="(prefers-color-scheme: dark)" />
          <img :src="p.providerIcon" alt="" />
        </picture>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <circle cx="8" cy="8" r="4.5" />
          <path d="M11.2 11.2 20 20m-3.5-3.5 2-2M14 14l1.5-1.5" stroke-linecap="round" />
        </svg>

        <div>
          <form v-if="renamingId === p.id" class="row" @submit.prevent="saveRename(p)">
            <input v-model="renameValue" aria-label="Passkey name" maxlength="64" required style="flex: 1" />
            <button type="submit" class="primary" :disabled="busy">Save</button>
            <button type="button" @click="renamingId = null">Cancel</button>
          </form>
          <strong v-else>{{ p.name }}</strong>
          <span v-if="p.credentialBackedUp" class="badge" title="Synced across your devices">Synced</span>
          <span v-else-if="p.credentialDeviceType === 'singleDevice'" class="badge" title="Bound to one device">
            This device only
          </span>
          <div class="muted">
            Created {{ dateFmt.format(p.registeredAt) }}
            <template v-if="p.lastUsedAt"> · Last used {{ dateFmt.format(p.lastUsedAt) }}</template>
          </div>
        </div>

        <div v-if="renamingId !== p.id" class="row actions">
          <button type="button" class="link" @click="startRename(p)">Rename</button>
          <button type="button" class="link danger" :disabled="busy" @click="removePasskey(p)">Remove</button>
        </div>
      </li>
    </ul>

    <div class="row">
      <button v-if="canCreatePasskey" type="button" class="primary" :disabled="busy" @click="addPasskey('management')">
        Create a passkey
      </button>
      <button type="button" :disabled="busy" @click="addPasskey('security-key')">Add a security key</button>
    </div>
  </section>
</template>
