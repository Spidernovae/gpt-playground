<script setup lang="ts">
interface Education {
  degree: string
  institution: string
  location: string
  period: string
  grade?: string
}
defineProps<{ education: Education }>()
</script>

<template>
  <section class="nb-card">
    <h2 class="nb-section-title">Education</h2>
    <div class="nb-row" style="justify-content: space-between; align-items: baseline;">
      <div>
        <strong>{{ education.degree }}</strong> — {{ education.institution }} ({{ education.location }})
      </div>
      <div class="nb-muted">{{ education.period }}</div>
    </div>
    <div v-if="education.grade" class="nb-subtitle" style="margin-top:8px;">Grade: {{ education.grade }}</div>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
</style>


