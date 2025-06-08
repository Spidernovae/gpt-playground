<script setup lang="ts">
import { ref, computed } from 'vue'

const initial = Array.from({ length: 15 }, (_, i) => i + 1).concat(0)
const tiles = ref<number[]>([])

function shuffle() {
  tiles.value = initial
    .slice()
    .sort(() => Math.random() - 0.5)
}

function moveTile(index: number) {
  const emptyIndex = tiles.value.indexOf(0)
  if (emptyIndex === -1) return

  const pos = index
  const emptyPos = emptyIndex
  const row = Math.floor(pos / 4)
  const col = pos % 4
  const erow = Math.floor(emptyPos / 4)
  const ecol = emptyPos % 4

  if ((row === erow && Math.abs(col - ecol) === 1) ||
      (col === ecol && Math.abs(row - erow) === 1)) {
    tiles.value[emptyIndex] = tiles.value[index]
    tiles.value[index] = 0
  }
}

const solved = computed(() =>
  tiles.value.every((tile, i) => tile === initial[i])
)

function solvePuzzle() {
  // TODO: implement algorithm that solves the puzzle
}

defineExpose({ solvePuzzle })

shuffle()
</script>

<template>
  <div class="puzzle">
    <div
      v-for="(tile, index) in tiles"
      :key="index"
      class="tile"
      :class="{ empty: tile === 0 }"
      @click="moveTile(index)"
    >
      {{ tile !== 0 ? tile : '' }}
    </div>
  </div>
  <button @click="shuffle">Shuffle</button>
  <button @click="solvePuzzle">Solve (placeholder)</button>
  <p v-if="solved">Solved!</p>
</template>

<style scoped>
.puzzle {
  display: grid;
  grid-template-columns: repeat(4, 60px);
  grid-template-rows: repeat(4, 60px);
  gap: 4px;
  margin-bottom: 1rem;
}
.tile {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
  border: 1px solid #ccc;
  font-weight: bold;
  cursor: pointer;
}
.tile.empty {
  background: #fff;
  cursor: default;
}
</style>
