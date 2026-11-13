<script setup lang="ts">
import { reactive, ref } from 'vue'
import DemoCard from '../components/DemoCard.vue'
import { useDemo } from '../lib/demo'
import { drawFrameGraph, median, Samples } from '../lib/frames'

const track = ref<HTMLElement>()
const ball = ref<HTMLElement>()
const graph = ref<HTMLCanvasElement>()
const r = reactive({ timestamp: 0, delta: 0, fps: 0, hz: 0, frames: 0 })

const frameTimes = new Samples(120)
let rafId = 0
let last: number | undefined
let x = 0
let lastReadout = 0

function frame(now: DOMHighResTimeStamp) {
  // `now` = when this frame started (same clock as performance.now()), shared by every
  // rAF callback in this frame, so all animations on the page agree on "the time".
  const dt = last === undefined ? 0 : now - last
  last = now
  if (dt > 0) frameTimes.push(dt)
  r.frames++

  // Move at 200 px per *second*, not per frame (experiment 3 shows why).
  const width = track.value!.clientWidth - ball.value!.offsetWidth
  x = (x + (200 * dt) / 1000) % width
  ball.value!.style.translate = `${x}px 0`

  if (now - lastReadout > 200) {
    // Update the text 5× a second so it's readable; the ball still moves every frame.
    lastReadout = now
    const typical = median(frameTimes.values)
    r.timestamp = now
    r.delta = dt
    r.fps = typical ? 1000 / typical : 0
    r.hz = typical ? Math.round(1000 / typical / 10) * 10 : 0
  }
  drawFrameGraph(graph.value!, frameTimes.values)

  rafId = requestAnimationFrame(frame) // ask for the *next* frame: rAF is one-shot
}

const { running, toggle } = useDemo('anatomy', {
  start() {
    last = undefined
    frameTimes.clear()
    rafId = requestAnimationFrame(frame)
  },
  stop: () => cancelAnimationFrame(rafId),
})

const code = `let last
function frame(now) {           // now: DOMHighResTimeStamp of this frame
  const dt = last === undefined ? 0 : now - last
  last = now

  x += speedPerSecond * dt / 1000
  el.style.translate = \`\${x}px 0\` // write styles; browser paints once after

  id = requestAnimationFrame(frame) // one-shot: re-schedule yourself
}
let id = requestAnimationFrame(frame)
// later: cancelAnimationFrame(id)`
</script>

<template>
  <DemoCard id="anatomy" :step="1" title="The loop: one callback per screen refresh" :running :code @toggle="toggle">
    <template #lesson>
      <p>
        <code>requestAnimationFrame(cb)</code> says: <em>“run <code>cb</code> right before the next paint.”</em>
        The browser calls it once per display refresh, passing a timestamp. Because it's one-shot, the callback
        re-requests itself, and that makes the loop.
      </p>
    </template>

    <div ref="track" class="track"><div ref="ball" class="ball" /></div>
    <dl class="stats">
      <div><dt>timestamp</dt><dd>{{ r.timestamp.toFixed(1) }} ms</dd></div>
      <div><dt>delta (this frame)</dt><dd>{{ r.delta.toFixed(2) }} ms</dd></div>
      <div><dt>frame rate</dt><dd>{{ r.fps.toFixed(1) }} fps</dd></div>
      <div><dt>your display</dt><dd>{{ r.hz ? `~${r.hz} Hz` : '–' }}</dd></div>
      <div><dt>callbacks</dt><dd>{{ r.frames }}</dd></div>
    </dl>
    <canvas ref="graph" class="graph" aria-label="Frame duration graph" role="img" />

    <template #takeaway>
      <p>
        Notice that the delta matches your monitor (16.7 ms at 60 Hz, 8.3 ms at 120 Hz) without you choosing a
        number. Drag this window to a monitor with a different refresh rate and watch it change. Red bars are
        frames that took longer, usually because the main thread was busy.
      </p>
    </template>
  </DemoCard>
</template>
