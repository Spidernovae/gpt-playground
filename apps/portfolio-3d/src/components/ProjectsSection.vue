<script setup lang="ts">
import { ref, computed } from 'vue'
interface Project { name: string; description: string }
const props = defineProps<{ id?: string; projects: Project[] }>()

const query = ref('')
const expanded = ref<number | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.projects
  return props.projects.filter(p =>
    p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  )
})

function toggle(i: number) {
  expanded.value = expanded.value === i ? null : i
}
</script>

<template>
  <section :id="id">
    <h2 class="nb-section-title">Projects</h2>
    <div class="nb-row" style="margin-bottom:10px;">
      <input
        class="nb-card"
        style="padding:10px 12px; width: 100%; max-width: 420px;"
        type="search" placeholder="Search projects..."
        v-model="query"
      />
    </div>
    <div class="nb-grid-2">
      <div v-for="(p, i) in filtered" :key="i" class="nb-card">
        <div class="nb-row" style="justify-content: space-between; align-items: baseline;">
          <strong>{{ p.name }}</strong>
          <button class="nb-button" @click="toggle(i)">{{ expanded === i ? 'Hide' : 'Details' }}</button>
        </div>
        <p class="nb-subtitle">{{ p.description }}</p>
        <div v-if="expanded === i" class="nb-subtitle" style="margin-top:10px;">
          This project details section can include stack, links, and screenshots.
        </div>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
  p { margin: 6px 0 0 0; }
</style>


