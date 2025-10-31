<script setup lang="ts">
defineProps<{ summary: string }>()
</script>

<template>
  <section class="nb-card">
    <h2 class="nb-section-title">About</h2>
    <p class="nb-subtitle">{{ summary }}</p>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
  p { margin: 0; }
</style>


