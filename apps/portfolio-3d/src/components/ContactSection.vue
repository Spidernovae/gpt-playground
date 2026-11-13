<script setup lang="ts">
import { ref } from 'vue'
interface Contact {
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
}
const props = defineProps<{ id?: string; contact: Contact }>()
const copied = ref(false)
async function copyEmail() {
  try {
    await navigator.clipboard.writeText(props.contact.email)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {}
}
</script>

<template>
  <section :id="id" class="nb-card">
    <h2 class="nb-section-title">Contact</h2>
    <div class="nb-row">
      <a class="nb-button" :href="`mailto:${contact.email}`">Email</a>
      <a class="nb-button alt" :href="contact.linkedin" target="_blank" rel="noreferrer">LinkedIn</a>
      <a class="nb-button purple" :href="contact.github" target="_blank" rel="noreferrer">GitHub</a>
      <span class="nb-badge" :title="contact.location">{{ contact.phone }}</span>
      <button class="nb-button" @click="copyEmail">{{ copied ? 'Copied!' : 'Copy email' }}</button>
    </div>
  </section>
</template>

<style scoped>
</style>


