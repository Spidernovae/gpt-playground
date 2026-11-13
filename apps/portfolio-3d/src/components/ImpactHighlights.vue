<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Highlight } from '../utils/insights'

const props = defineProps<{ id?: string; highlights: Highlight[] }>()

function formatValue(n: number, suffix?: string) {
  if (suffix === '%') return `${n}${suffix}`
  if (n >= 1_000_000) return `${Math.round(n / 1_000_0) / 100}M${suffix || ''}`
  if (n >= 1_000) return `${Math.round(n / 10) / 100}K${suffix || ''}`
  return `${n}${suffix || ''}`
}

const animatedValues = ref<number[]>([])
onMounted(() => {
  animatedValues.value = props.highlights.map(() => 0)
  props.highlights.forEach((h, i) => animate(i, h.value))
})

function animate(index: number, target: number) {
  const duration = 900
  const start = performance.now()
  const tick = (t: number) => {
    const p = Math.min(1, (t - start) / duration)
    animatedValues.value[index] = Math.floor(target * (1 - Math.pow(1 - p, 3)))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
</script>

<template>
  <section :id="id">
    <h2 class="nb-section-title">Impact Highlights</h2>
    <div class="nb-grid-2">
      <div v-for="(h, i) in highlights" :key="i" class="nb-card">
        <div style="font-size:2.2rem; font-weight:900; line-height:1;">
          {{ formatValue(animatedValues[i] || 0, h.suffix) }}
        </div>
        <div class="nb-subtitle">{{ h.label }}</div>
      </div>
    </div>
  </section>
  <hr class="nb-hr" />
</template>

<style scoped>
</style>



