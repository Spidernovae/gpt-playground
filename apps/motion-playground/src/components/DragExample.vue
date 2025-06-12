<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<template>
  <motion.div
    class="draggable"
    drag
    :dragConstraints="{ left: -100, right: 100, top: -50, bottom: 50 }"
  />
</template>

<style scoped>
.draggable {
  width: 80px;
  height: 80px;
  background: #ff4757;
  margin: 2rem auto;
}
</style>
