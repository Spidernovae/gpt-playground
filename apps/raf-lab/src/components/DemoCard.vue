<script setup lang="ts">
defineProps<{ id: string; step: number; title: string; running: boolean; code: string }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <section :id="id" class="card" :aria-labelledby="`${id}-title`">
    <header class="card-head">
      <div>
        <p class="eyebrow">Experiment {{ step }}</p>
        <h2 :id="`${id}-title`">{{ title }}</h2>
      </div>
      <button type="button" class="play" :class="{ on: running }" @click="$emit('toggle')">
        {{ running ? 'Pause' : 'Run' }}
      </button>
    </header>

    <div class="lesson"><slot name="lesson" /></div>
    <div class="stage"><slot /></div>

    <details>
      <summary>Show the pattern</summary>
      <pre><code>{{ code }}</code></pre>
    </details>
    <div v-if="$slots.takeaway" class="takeaway"><slot name="takeaway" /></div>
  </section>
</template>
