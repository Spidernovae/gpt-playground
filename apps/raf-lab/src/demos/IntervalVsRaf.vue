<script setup lang="ts">
import { reactive, ref } from 'vue'
import DemoCard from '../components/DemoCard.vue'
import { useDemo } from '../lib/demo'

const track = ref<HTMLElement>()
const timerBall = ref<HTMLElement>()
const rafBall = ref<HTMLElement>()
const intervalMs = ref(1000 / 60)

/** Per painted frame: how many times did the timer move its ball since the previous paint? */
const hist = reactive({ zero: 0, one: 0, many: 0 })

let rafId = 0
let timerId = 0
let last: number | undefined
let timerX = 0
let rafX = 0
let ticksSinceFrame = 0

const SPEED = 240 // px per second, for both balls

function timerTick() {
  // Classic timer animation: fixed step per tick, assuming the tick is exactly on time.
  const width = track.value!.clientWidth - timerBall.value!.offsetWidth
  timerX = (timerX + SPEED * (intervalMs.value / 1000)) % width
  timerBall.value!.style.translate = `${timerX}px 0`
  ticksSinceFrame++
}

function frame(now: number) {
  const dt = last === undefined ? 0 : now - last
  last = now
  const width = track.value!.clientWidth - rafBall.value!.offsetWidth
  rafX = (rafX + (SPEED * dt) / 1000) % width
  rafBall.value!.style.translate = `${rafX}px 0`

  // Classify what the timer ball did between the previous paint and this one.
  if (dt > 0) {
    if (ticksSinceFrame === 0) hist.zero++
    else if (ticksSinceFrame === 1) hist.one++
    else hist.many++
  }
  ticksSinceFrame = 0
  rafId = requestAnimationFrame(frame)
}

function start() {
  last = undefined
  Object.assign(hist, { zero: 0, one: 0, many: 0 })
  timerId = window.setInterval(timerTick, intervalMs.value)
  rafId = requestAnimationFrame(frame)
}
function stop() {
  clearInterval(timerId)
  cancelAnimationFrame(rafId)
}
const { running, toggle } = useDemo('interval', { start, stop })

function setInterval_(ms: number) {
  intervalMs.value = ms
  if (running.value) {
    stop()
    start()
  }
}

const pct = (n: number) => {
  const total = hist.zero + hist.one + hist.many
  return total ? `${((n / total) * 100).toFixed(0)}%` : '–'
}

const code = `// ❌ Timer: runs on its own clock, unaware of the display
setInterval(() => { x += 4; el.style.translate = \`\${x}px 0\` }, 1000 / 60)

// ✅ rAF: runs exactly once per paint, at the display's own rate
function frame(now) {
  x += speed * (now - last) / 1000; last = now
  el.style.translate = \`\${x}px 0\`
  requestAnimationFrame(frame)
}`
</script>

<template>
  <DemoCard id="interval" :step="2" title="rAF vs setInterval: in sync with the screen" :running :code @toggle="toggle">
    <template #lesson>
      <p>
        Both balls aim for the same speed. The top one uses <code>setInterval(fn, 16.7)</code>, the classic way;
        the bottom one uses rAF. The timer runs on its own clock, so it drifts against the display: some frames
        get no update (the ball <strong>stalls</strong>) and some get two (the ball <strong>skips</strong>).
        Your eye sees this as judder.
      </p>
    </template>

    <div class="row" role="group" aria-label="Timer interval">
      <span class="muted">Timer interval:</span>
      <button
        v-for="opt in [
          { ms: 1000 / 60, label: '16.7 ms (60/s)' },
          { ms: 1000 / 30, label: '33 ms (30/s)' },
          { ms: 10, label: '10 ms (100/s)' },
        ]"
        :key="opt.label"
        type="button"
        class="chip"
        :aria-pressed="Math.abs(intervalMs - opt.ms) < 0.01"
        @click="setInterval_(opt.ms)"
      >
        {{ opt.label }}
      </button>
    </div>

    <div ref="track" class="lanes">
      <div class="lane"><span class="lane-label">setInterval</span><div ref="timerBall" class="ball warn" /></div>
      <div class="lane"><span class="lane-label">rAF</span><div ref="rafBall" class="ball" /></div>
    </div>

    <dl class="stats">
      <div><dt>Frames where timer ball stalled</dt><dd class="bad">{{ pct(hist.zero) }}</dd></div>
      <div><dt>Moved exactly once</dt><dd class="good">{{ pct(hist.one) }}</dd></div>
      <div><dt>Moved 2+ times (skipped)</dt><dd class="bad">{{ pct(hist.many) }}</dd></div>
      <div><dt>rAF ball</dt><dd class="good">100% · one update every paint</dd></div>
    </dl>

    <template #takeaway>
      <p>
        On a 120 Hz screen, a 60/s timer stalls on about half of all frames. At 100/s it updates more often than a
        60 Hz screen can show, so the extra work is thrown away. rAF can't drift like this: it <em>is</em> the
        display's clock.
      </p>
    </template>
  </DemoCard>
</template>
