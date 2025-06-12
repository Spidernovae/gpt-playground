<script setup lang="ts">
import BasicExample from './components/BasicExample.vue'
import HoverExample from './components/HoverExample.vue'
import DragExample from './components/DragExample.vue'
</script>

<template>
  <h1>Motion Playground</h1>
  <BasicExample />
  <HoverExample />
  <DragExample />
</template>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 1rem;
}
</style>
