<script setup lang="ts">
import { ref } from 'vue'
interface ExperienceItem {
  company: string
  role: string
  period: string
  location: string
  achievements: string[]
}
const props = defineProps<{ id?: string; experience: ExperienceItem[] }>()
const open = ref<Record<number, boolean>>({})
function toggle(idx: number) { open.value[idx] = !open.value[idx] }
</script>

<template>
  <section :id="id">
    <h2 class="nb-section-title">Experience</h2>
    <div class="nb-stack">
      <div v-for="(job, idx) in experience" :key="idx" class="nb-card">
        <div class="nb-row" style="justify-content: space-between; align-items: baseline;">
          <div>
            <strong>{{ job.role }}</strong> @ {{ job.company }}
          </div>
          <div class="nb-muted">{{ job.period }} • {{ job.location }}</div>
        </div>
        <div class="nb-row" style="margin-top:8px;">
          <button class="nb-button" @click="toggle(idx)">{{ open[idx] ? 'Hide' : 'Show' }} achievements</button>
        </div>
        <ul v-if="open[idx]" class="nb-list">
          <li v-for="(a, i) in job.achievements" :key="i">{{ a }}</li>
        </ul>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
  
</template>

<style scoped>
</style>


