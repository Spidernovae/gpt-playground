<script setup lang="ts">
type SkillGroups = Record<string, string[]>
defineProps<{ skills: SkillGroups }>()
</script>

<template>
  <section>
    <h2 class="nb-section-title">Skills</h2>
    <div class="nb-grid-2">
      <div v-for="(items, group) in skills" :key="group" class="nb-card">
        <strong style="display:block; margin-bottom:8px;">{{ group.replaceAll('_', ' ') }}</strong>
        <div class="nb-row">
          <span v-for="(s, i) in items" :key="i" class="nb-badge">{{ s }}</span>
        </div>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
</style>


