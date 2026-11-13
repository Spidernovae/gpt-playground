<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { api, type User } from '../lib/api'
import { getCapabilities, signInWithPasskey, startAutofillSignIn } from '../lib/webauthn'
import { errorMessage } from '../lib/errors'

const emit = defineEmits<{
  'signed-in': [user: User, opts: { viaPassword?: boolean }]
  switch: []
}>()

const username = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const passkeysSupported = ref(true)

let autofill = new AbortController()

/** Arm Conditional UI so passkeys show up in the username field's autofill suggestions. */
async function armAutofill() {
  autofill.abort()
  autofill = new AbortController()
  const { signal } = autofill
  try {
    const user = await startAutofillSignIn(signal)
    if (user) emit('signed-in', user, {})
  } catch (err) {
    if (signal.aborted) return
    error.value = errorMessage(err)
    void armAutofill() // let the user pick another passkey or type a password
  }
}

async function onPasskeyButton() {
  autofill.abort() // only one WebAuthn request may be pending at a time
  busy.value = true
  error.value = ''
  try {
    const user = await signInWithPasskey()
    if (user) return emit('signed-in', user, {})
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    busy.value = false
  }
  void armAutofill() // cancelled or failed: re-arm autofill suggestions
}

async function onPasswordSubmit() {
  autofill.abort()
  busy.value = true
  error.value = ''
  try {
    const { user } = await api.passwordLogin({ username: username.value, password: password.value })
    emit('signed-in', user, { viaPassword: true })
  } catch (err) {
    error.value = errorMessage(err)
    password.value = ''
    void armAutofill()
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  const caps = await getCapabilities()
  passkeysSupported.value = 'PublicKeyCredential' in window && caps.passkeyPlatformAuthenticator !== false
  void armAutofill()
})
onBeforeUnmount(() => autofill.abort())
</script>

<template>
  <section class="card" aria-labelledby="signin-heading">
    <h1 id="signin-heading">Sign in</h1>
    <p id="signin-hint" class="muted">
      Choose a saved passkey from the username field, or use the button below.
    </p>

    <p v-if="error" class="alert error" role="alert">{{ error }}</p>

    <button
      v-if="passkeysSupported"
      type="button"
      class="primary"
      style="width: 100%"
      :disabled="busy"
      @click="onPasskeyButton"
    >
      Sign in with a passkey
    </button>

    <div class="divider">or use your password</div>

    <form @submit.prevent="onPasswordSubmit">
      <label>
        Username
        <!-- "webauthn" token enables passkey suggestions in autofill (Conditional UI) -->
        <input
          v-model="username"
          name="username"
          autocomplete="username webauthn"
          autocapitalize="none"
          spellcheck="false"
          required
          autofocus
          aria-describedby="signin-hint"
        />
      </label>
      <label>
        Password
        <input v-model="password" type="password" name="password" autocomplete="current-password" required />
      </label>
      <button type="submit" :disabled="busy">Sign in with password</button>
    </form>

    <p class="muted" style="margin: 1.25rem 0 0">
      New here? <button type="button" class="link" @click="emit('switch')">Create an account</button>
    </p>
  </section>
</template>
