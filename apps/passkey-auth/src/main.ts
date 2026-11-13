// Back-fills getClientCapabilities(), parse*OptionsFromJSON() and PublicKeyCredential#toJSON()
// in browsers that support WebAuthn but not these newer methods.
import 'webauthn-polyfills'
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
