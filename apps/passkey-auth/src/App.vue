<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import { api, type User } from './lib/api'
import { tryConditionalCreate } from './lib/webauthn'
import SignIn from './components/SignIn.vue'
import SignUp from './components/SignUp.vue'
import AccountPanel from './components/AccountPanel.vue'

const loading = ref(true)
const user = ref<User | null>(null)
const view = ref<'signin' | 'signup'>('signin')
const notice = ref('')
/** Bumped whenever a passkey is added outside the account panel, so it reloads its list. */
const passkeysVersion = ref(0)

watchEffect(() => {
  document.title = user.value
    ? 'Account · Passkey Playground'
    : view.value === 'signup'
      ? 'Create account · Passkey Playground'
      : 'Sign in · Passkey Playground'
})

onMounted(async () => {
  try {
    user.value = (await api.session()).user
  } finally {
    loading.value = false
  }
})

function onSignedIn(signedIn: User, opts: { viaPassword?: boolean; message?: string } = {}) {
  user.value = signedIn
  notice.value = opts.message ?? ''
  if (opts.viaPassword) {
    // Silent upgrade: if the password manager just filled this password, it can add a passkey too.
    void tryConditionalCreate().then((passkey) => {
      if (!passkey) return
      notice.value = `Your password manager saved a passkey (${passkey.name}). Next time, sign in with it.`
      passkeysVersion.value++
    })
  }
}

function onSignedOut() {
  user.value = null
  notice.value = ''
  view.value = 'signin'
}
</script>

<template>
  <main>
    <p v-if="loading" class="muted" aria-live="polite">Loading…</p>

    <template v-else-if="user">
      <p v-if="notice" class="alert success" role="status">{{ notice }}</p>
      <AccountPanel
        :user="user"
        :passkeys-version="passkeysVersion"
        @user-updated="user = $event"
        @signed-out="onSignedOut"
      />
    </template>

    <SignUp v-else-if="view === 'signup'" @signed-in="onSignedIn" @switch="view = 'signin'" />
    <SignIn v-else @signed-in="onSignedIn" @switch="view = 'signup'" />
  </main>
</template>
