<script setup lang="ts">
type Languages = Record<string, string>
defineProps<{ languages: Languages; interests: string[] }>()
</script>

<template>
  <section class="nb-grid-2">
    <div class="nb-card">
      <h2 class="nb-section-title">Languages</h2>
      <div class="nb-row">
        <span v-for="(level, lang) in languages" :key="lang" class="nb-badge">
          {{ lang }} — {{ level }}
        </span>
      </div>
    </div>
    <div class="nb-card">
      <h2 class="nb-section-title">Interests</h2>
      <div class="nb-row">
        <span v-for="(h, i) in interests" :key="i" class="nb-badge">{{ h }}</span>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
</style>


