<script setup lang="ts">
import { ref } from 'vue'
import { motion } from 'motion-v'

const toggle = ref(false)
</script>

<template>
  <div class="example">
    <button @click="toggle = !toggle">Toggle Move</button>
    <motion.div
      class="box"
      :initial="{ x: 0 }"
      :animate="{ x: toggle ? 150 : 0 }"
      :transition="{ type: 'spring' }"
    />
  </div>
</template>

<style scoped>
.example {
  margin-bottom: 2rem;
}
.box {
  width: 60px;
  height: 60px;
  background: #42b883;
  margin-top: 1rem;
}
</style>
