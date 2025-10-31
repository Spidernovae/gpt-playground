<script setup lang="ts">
interface Project { name: string; description: string }
defineProps<{ projects: Project[] }>()
</script>

<template>
  <section>
    <h2 class="nb-section-title">Projects</h2>
    <div class="nb-grid-2">
      <div v-for="(p, i) in projects" :key="i" class="nb-card">
        <div class="nb-row" style="justify-content: space-between; align-items: baseline;">
          <strong>{{ p.name }}</strong>
          <span class="nb-badge">Project</span>
        </div>
        <p class="nb-subtitle">{{ p.description }}</p>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
  p { margin: 6px 0 0 0; }
</style>


