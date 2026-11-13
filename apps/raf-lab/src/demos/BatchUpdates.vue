<script setup lang="ts">
import { reactive, ref } from 'vue'
import DemoCard from '../components/DemoCard.vue'
import { useDemo } from '../lib/demo'
import { busyWait, fitCanvas } from '../lib/frames'

const chart = ref<HTMLCanvasElement>()
const spinner = ref<HTMLElement>()
const mode = ref<'every' | 'raf'>('every')
const rate = ref(1000) // updates per second from the "server"
const costMs = ref(2) // cost of one render
const s = reactive({ updates: 0, renders: 0, fps: 0, latest: 0 })

// --- The data feed: think WebSocket price ticks, sensor readings, log lines --------------------
const series: number[] = []
let value = 50
let feedId = 0
const TICK_MS = 4

function onUpdate(v: number) {
  series.push(v)
  if (series.length > 600) series.shift()
  counts.updates++
  if (mode.value === 'every') render()
  else scheduleRender()
}

// --- Strategy B: coalesce. Mark dirty and render at most once per frame -----------------------
let renderScheduled = false
function scheduleRender() {
  if (renderScheduled) return
  renderScheduled = true
  requestAnimationFrame(() => {
    renderScheduled = false
    render()
  })
}

function render() {
  counts.renders++
  busyWait(costMs.value) // layout, formatting, re-drawing a big chart...
  s.latest = series[series.length - 1] ?? 0
  const { ctx, width, height } = fitCanvas(chart.value!)
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = getComputedStyle(chart.value!).color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  series.forEach((v, i) => {
    const x = (i / 599) * width
    const y = height - (v / 100) * height
    if (i) ctx.lineTo(x, y)
    else ctx.moveTo(x, y)
  })
  ctx.stroke()
}

// --- Independent frame meter + spinner: shows how responsive the page still is ---------------
const counts = { updates: 0, renders: 0, frames: 0 }
let meterId = 0
let angle = 0
let lastFrame: number | undefined
let lastSecond = 0
function meter(now: number) {
  const dt = lastFrame === undefined ? 0 : now - lastFrame
  lastFrame = now
  counts.frames++
  angle = (angle + 0.36 * dt) % 360 // one turn per second
  spinner.value!.style.rotate = `${angle}deg`
  if (now - lastSecond >= 1000) {
    const secs = (now - lastSecond) / 1000
    s.updates = Math.round(counts.updates / secs)
    s.renders = Math.round(counts.renders / secs)
    s.fps = Math.round(counts.frames / secs)
    counts.updates = counts.renders = counts.frames = 0
    lastSecond = now
  }
  meterId = requestAnimationFrame(meter)
}

const { running, toggle } = useDemo('batch', {
  start() {
    lastFrame = undefined
    lastSecond = performance.now()
    counts.updates = counts.renders = counts.frames = 0
    feedId = window.setInterval(() => {
      const burst = Math.max(1, Math.round((rate.value * TICK_MS) / 1000))
      for (let i = 0; i < burst; i++) {
        value = Math.min(100, Math.max(0, value + (Math.random() - 0.5) * 4))
        onUpdate(value)
      }
    }, TICK_MS)
    meterId = requestAnimationFrame(meter)
  },
  stop() {
    clearInterval(feedId)
    cancelAnimationFrame(meterId)
  },
})

const code = `let scheduled = false
socket.onmessage = (e) => {
  state.push(JSON.parse(e.data))   // always keep the data...
  if (scheduled) return            // ...but render at most once per frame
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render(state)                  // draws the latest state
  })
}`
</script>

<template>
  <DemoCard id="batch" :step="4" title="Batching: render once per frame, not once per event" :running :code @toggle="toggle">
    <template #lesson>
      <p>
        Data can arrive much faster than the screen refreshes (WebSocket ticks, sensors, logs). Rendering on
        every message wastes work the user can never see, because only the last render before each paint is
        shown. With rAF you store the data, set a “dirty” flag, and render <strong>once per frame</strong>.
      </p>
    </template>

    <div class="row" role="radiogroup" aria-label="Render strategy">
      <label class="radio"><input v-model="mode" type="radio" value="every" /> Render on every update</label>
      <label class="radio"><input v-model="mode" type="radio" value="raf" /> Batch with rAF</label>
    </div>
    <div class="sliders">
      <label class="slider">
        <span>Incoming updates: <strong>{{ rate }}/s</strong></span>
        <input v-model.number="rate" type="range" min="250" max="5000" step="250" />
      </label>
      <label class="slider">
        <span>Cost of one render: <strong>{{ costMs }} ms</strong></span>
        <input v-model.number="costMs" type="range" min="0" max="8" step="0.5" />
      </label>
    </div>

    <div class="feed">
      <canvas ref="chart" class="chart" role="img" aria-label="Live data chart" />
      <div class="spinner-box" title="Spins smoothly only if the main thread is free">
        <div ref="spinner" class="spinner" />
      </div>
    </div>

    <dl class="stats">
      <div><dt>Updates received</dt><dd>{{ s.updates }}/s</dd></div>
      <div><dt>Renders</dt><dd :class="mode === 'raf' ? 'good' : 'bad'">{{ s.renders }}/s</dd></div>
      <div><dt>Page frame rate</dt><dd :class="s.fps >= 50 ? 'good' : 'bad'">{{ s.fps }} fps</dd></div>
      <div><dt>Latest value</dt><dd>{{ s.latest.toFixed(1) }}</dd></div>
    </dl>

    <template #takeaway>
      <p>
        Rendering every update at 2 ms × 1000/s asks for 2 seconds of work each second. The page chokes and the
        spinner stutters. Switch to batching: renders fall to your refresh rate, the frame rate recovers, and
        the chart shows the same data. (Browsers already align <code>pointermove</code> and <code>scroll</code>
        to frames, but your own data sources are not aligned.)
      </p>
    </template>
  </DemoCard>
</template>
