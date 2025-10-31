<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <footer class="nb-footer nb-row" style="justify-content: space-between; align-items: center;">
    <span class="nb-muted">© {{ new Date().getFullYear() }} {{ name }}</span>
    <span class="nb-muted">Built with Vue 3 + Vite</span>
  </footer>
</template>

<style scoped>
</style>


