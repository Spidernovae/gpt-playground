<script setup lang="ts">
interface CertGroup { provider: string; certifications: string[] }
defineProps<{ certificates: CertGroup[] }>()
</script>

<template>
  <section>
    <h2 class="nb-section-title">Certificates</h2>
    <div class="nb-grid-2">
      <div v-for="(g, i) in certificates" :key="i" class="nb-card">
        <strong style="display:block; margin-bottom:8px;">{{ g.provider }}</strong>
        <ul class="nb-list">
          <li v-for="(c, j) in g.certifications" :key="j">{{ c }}</li>
        </ul>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
</style>


