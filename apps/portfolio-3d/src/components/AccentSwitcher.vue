<script setup lang="ts">
const palettes = [
  { a: '#ff3b3b', b: '#00d1b2', c: '#6c5ce7' },
  { a: '#ff8a00', b: '#00bcd4', c: '#8bc34a' },
  { a: '#e91e63', b: '#03a9f4', c: '#ffc107' },
]

function apply(p: { a: string; b: string; c: string }) {
  const r = document.documentElement
  r.style.setProperty('--nb-accent', p.a)
  r.style.setProperty('--nb-accent-2', p.b)
  r.style.setProperty('--nb-accent-3', p.c)
}
</script>

<template>
  <div class="nb-row">
    <button v-for="(p,i) in palettes" :key="i" class="nb-button" @click="apply(p)">
      Theme {{ i+1 }}
    </button>
  </div>
  
</template>

<style scoped>
</style>



