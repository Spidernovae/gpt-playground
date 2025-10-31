<script setup lang="ts">
interface Contact {
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
}
defineProps<{
  name: string
  title: string
  contact: Contact
}>()
</script>

<template>
  <header class="nb-card nb-header">
    <div class="nb-name">{{ name }}</div>
    <div class="nb-title">{{ title }}</div>
    <div class="nb-row">
      <a class="nb-button" :href="`mailto:${contact.email}`">Email</a>
      <a class="nb-button alt" :href="contact.linkedin" target="_blank" rel="noreferrer">LinkedIn</a>
      <a class="nb-button purple" :href="contact.github" target="_blank" rel="noreferrer">GitHub</a>
      <span class="nb-badge" :title="contact.phone">{{ contact.location }}</span>
    </div>
  </header>
</template>

<style scoped>
</style>


