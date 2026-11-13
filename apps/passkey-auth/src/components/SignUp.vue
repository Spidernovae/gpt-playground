<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type User } from '../lib/api'
import { getCapabilities, registerPasskey } from '../lib/webauthn'
import { errorMessage } from '../lib/errors'

const emit = defineEmits<{
  'signed-in': [user: User, opts: { message?: string }]
  switch: []
}>()

const username = ref('')
const displayName = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const canCreatePasskey = ref(false)

onMounted(async () => {
  const caps = await getCapabilities()
  canCreatePasskey.value = caps.passkeyPlatformAuthenticator === true && caps.conditionalGet === true
})

async function onSubmit() {
  busy.value = true
  error.value = ''
  let user: User
  try {
    user = (await api.signup({
      username: username.value,
      displayName: displayName.value,
      password: password.value,
    })).user
  } catch (err) {
    error.value = errorMessage(err)
    busy.value = false
    return
  }

  // Account exists and we're signed in; now offer a passkey on this device (promotion flow).
  let message = 'Account created.'
  if (canCreatePasskey.value) {
    try {
      const passkey = await registerPasskey('promotion')
      message = passkey
        ? `Account created and a passkey was saved to ${passkey.name}.`
        : 'Account created. You can add a passkey any time below.'
    } catch (err) {
      message = `Account created, but the passkey wasn't saved: ${errorMessage(err)}`
    }
  }
  busy.value = false
  emit('signed-in', user, { message })
}
</script>

<template>
  <section class="card" aria-labelledby="signup-heading">
    <h1 id="signup-heading">Create an account</h1>
    <p class="muted">
      <template v-if="canCreatePasskey">
        Right after this, your device will offer to save a passkey so you won't need the password.
      </template>
      <template v-else>Passkeys aren't available in this browser; you'll sign in with your password.</template>
    </p>

    <p v-if="error" class="alert error" role="alert">{{ error }}</p>

    <form @submit.prevent="onSubmit">
      <label>
        Username
        <input
          v-model="username"
          name="username"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          minlength="3"
          maxlength="64"
          pattern="[a-zA-Z0-9._@+\-]+"
          required
          autofocus
        />
      </label>
      <label>
        Display name
        <input v-model="displayName" name="name" autocomplete="name" maxlength="64" />
      </label>
      <label>
        Password <span class="muted">(fallback sign-in)</span>
        <input v-model="password" type="password" name="new-password" autocomplete="new-password" minlength="8" required />
      </label>
      <button type="submit" class="primary" :disabled="busy">Create account</button>
    </form>

    <p class="muted" style="margin: 1.25rem 0 0">
      Already have an account? <button type="button" class="link" @click="emit('switch')">Sign in</button>
    </p>
  </section>
</template>
