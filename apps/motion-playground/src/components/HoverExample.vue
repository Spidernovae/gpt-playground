<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<template>
  <motion.button
    class="fancy"
    :initial="{ scale: 1 }"
    :while-hover="{ scale: 1.2 }"
    :transition="{ duration: 0.3 }"
  >
    Hover me
  </motion.button>
</template>

<style scoped>
.fancy {
  padding: 0.6em 1.2em;
  font-size: 1rem;
  border-radius: 8px;
  border: none;
  background: #646cff;
  color: white;
  cursor: pointer;
}
</style>
