<script setup lang="ts">
import { reactive, ref } from 'vue'
import DemoCard from '../components/DemoCard.vue'
import { useDemo } from '../lib/demo'

interface Trip {
  hiddenFor: number
  rafCalls: number
  timerCalls: number
  firstDelta: number
}

const live = reactive({ raf: 0, timer: 0 })
const trips = ref<Trip[]>([])

let rafId = 0
let timerId = 0
let last: number | undefined
let hiddenAt = 0
let rafAtHide = 0
let timerAtHide = 0
let pending: Omit<Trip, 'firstDelta'> | null = null

function frame(now: number) {
  const dt = last === undefined ? 0 : now - last
  last = now
  live.raf++
  if (pending) {
    // The first frame after coming back sees the whole gap as one giant delta.
    trips.value.unshift({ ...pending, firstDelta: dt })
    pending = null
  }
  rafId = requestAnimationFrame(frame)
}

function onVisibility() {
  if (document.hidden) {
    hiddenAt = performance.now()
    rafAtHide = live.raf
    timerAtHide = live.timer
  } else if (hiddenAt) {
    pending = {
      hiddenFor: performance.now() - hiddenAt,
      rafCalls: live.raf - rafAtHide,
      timerCalls: live.timer - timerAtHide,
    }
    hiddenAt = 0
  }
}

const { running, toggle } = useDemo('hidden', {
  start() {
    last = undefined
    live.raf = live.timer = 0
    trips.value = []
    document.addEventListener('visibilitychange', onVisibility)
    timerId = window.setInterval(() => live.timer++, 1000 / 60)
    rafId = requestAnimationFrame(frame)
  },
  stop() {
    document.removeEventListener('visibilitychange', onVisibility)
    clearInterval(timerId)
    cancelAnimationFrame(rafId)
  },
})

const code = `// Nothing to write: browsers stop calling rAF callbacks while
// the tab is hidden (and in hidden iframes). Timers keep firing,
// just throttled, so they keep burning CPU and battery.

// The one thing you MUST handle is the huge delta on return:
const dt = Math.min(now - last, 100)`
</script>

<template>
  <DemoCard id="hidden" :step="5" title="Free pausing: hidden tabs cost nothing" :running :code @toggle="toggle">
    <template #lesson>
      <p>
        Click <strong>Run</strong>, switch to another tab for a few seconds, then come back. A rAF loop and a
        60/s <code>setInterval</code> both count their calls. While the tab is hidden the browser stops calling
        rAF completely, saving CPU and battery without any code from you.
      </p>
    </template>

    <dl class="stats">
      <div><dt>rAF callbacks</dt><dd>{{ live.raf }}</dd></div>
      <div><dt>setInterval callbacks</dt><dd>{{ live.timer }}</dd></div>
    </dl>

    <p v-if="running && trips.length === 0" class="muted">Waiting for you to switch tabs and come back…</p>
    <table v-if="trips.length" class="trips">
      <caption class="muted">Each time you left this tab</caption>
      <thead>
        <tr><th scope="col">Hidden for</th><th scope="col">rAF calls</th><th scope="col">Timer calls</th><th scope="col">First delta back</th></tr>
      </thead>
      <tbody>
        <tr v-for="(t, i) in trips" :key="i">
          <td>{{ (t.hiddenFor / 1000).toFixed(1) }} s</td>
          <td class="good">{{ t.rafCalls }}</td>
          <td class="bad">{{ t.timerCalls }}</td>
          <td class="bad">{{ t.firstDelta.toFixed(0) }} ms</td>
        </tr>
      </tbody>
    </table>

    <template #takeaway>
      <p>
        rAF shows ~0 calls while hidden; the timer kept going (throttled to about 1/s, and less over time).
        Note the <strong>first delta back</strong>: thousands of milliseconds. Without a clamp like
        <code>Math.min(dt, 100)</code>, your physics would teleport everything on return.
      </p>
    </template>
  </DemoCard>
</template>
