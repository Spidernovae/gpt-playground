import { computed, onBeforeUnmount, ref, watch } from 'vue'

/**
 * Only one experiment runs at a time. Otherwise they would steal frames from each other
 * and the measurements would be meaningless. Starting one stops whichever was running.
 * Nothing starts on its own, which also respects prefers-reduced-motion by default.
 */
const activeDemo = ref<string | null>(null)

export function useDemo(id: string, hooks: { start: () => void; stop: () => void }) {
  const running = computed(() => activeDemo.value === id)
  watch(running, (on) => (on ? hooks.start() : hooks.stop()))
  onBeforeUnmount(() => {
    if (running.value) {
      hooks.stop()
      activeDemo.value = null
    }
  })
  const toggle = () => (activeDemo.value = running.value ? null : id)
  return { running, toggle }
}
