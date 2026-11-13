<script setup lang="ts">
type ExperienceItem = {
  company: string
  role: string
  period: string
  location: string
  achievements: string[]
}
defineProps<{ id?: string; experience: ExperienceItem[] }>()
</script>

<template>
  <section :id="id">
    <h2 class="nb-section-title">Timeline</h2>
    <div class="timeline">
      <div v-for="(job, i) in experience" :key="i" class="row">
        <div class="dot" />
        <div class="card nb-card">
          <div class="nb-row" style="justify-content: space-between;">
            <strong>{{ job.role }}</strong>
            <span class="nb-muted">{{ job.period }}</span>
          </div>
          <div class="nb-subtitle">{{ job.company }} — {{ job.location }}</div>
        </div>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
.timeline {
  position: relative;
  margin-left: 12px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--nb-border);
  box-shadow: 3px 3px 0 var(--nb-shadow);
}
.row {
  position: relative;
  margin: 18px 0 18px 14px;
}
.dot {
  position: absolute;
  left: -26px;
  top: 8px;
  width: 14px;
  height: 14px;
  background: var(--nb-accent);
  border: 3px solid var(--nb-border);
  box-shadow: 3px 3px 0 var(--nb-shadow);
  border-radius: 50%;
}
.card { }
</style>



