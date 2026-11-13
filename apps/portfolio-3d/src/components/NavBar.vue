<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ sections: { id: string; label: string }[] }>()
const activeId = ref<string>(props.sections[0]?.id || '')

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (el) {
    window.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' })
  }
}

let observer: IntersectionObserver | null = null
onMounted(() => {
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) activeId.value = (visible.target as HTMLElement).id
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.5, 1] })

    for (const s of props.sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <nav class="nb-card nb-row navbar">
    <button
      v-for="s in sections"
      :key="s.id"
      class="nb-button"
      :class="{ active: activeId === s.id }"
      @click="scrollToId(s.id)"
    >
      {{ s.label }}
    </button>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 10px;
  z-index: 10;
}
.active { filter: saturate(1.2) brightness(1.05); }
</style>



