<script setup lang="ts">
interface ExperienceItem {
  company: string
  role: string
  period: string
  location: string
  achievements: string[]
}
defineProps<{ experience: ExperienceItem[] }>()
</script>

<template>
  <section>
    <h2 class="nb-section-title">Experience</h2>
    <div class="nb-stack">
      <div v-for="(job, idx) in experience" :key="idx" class="nb-card">
        <div class="nb-row" style="justify-content: space-between; align-items: baseline;">
          <div>
            <strong>{{ job.role }}</strong> @ {{ job.company }}
          </div>
          <div class="nb-muted">{{ job.period }} • {{ job.location }}</div>
        </div>
        <ul class="nb-list">
          <li v-for="(a, i) in job.achievements" :key="i">{{ a }}</li>
        </ul>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
  
</template>

<style scoped>
</style>


