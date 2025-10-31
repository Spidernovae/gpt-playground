<script setup lang="ts">
interface Contact {
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
}
defineProps<{ contact: Contact }>()
</script>

<template>
  <section class="nb-card">
    <h2 class="nb-section-title">Contact</h2>
    <div class="nb-row">
      <a class="nb-button" :href="`mailto:${contact.email}`">Email</a>
      <a class="nb-button alt" :href="contact.linkedin" target="_blank" rel="noreferrer">LinkedIn</a>
      <a class="nb-button purple" :href="contact.github" target="_blank" rel="noreferrer">GitHub</a>
      <span class="nb-badge" :title="contact.location">{{ contact.phone }}</span>
    </div>
  </section>
</template>

<style scoped>
</style>


