<script setup lang="ts">
import { reactive, ref } from 'vue'
import DemoCard from '../components/DemoCard.vue'
import { useDemo } from '../lib/demo'
import { busyWait, median, Samples } from '../lib/frames'

const track = ref<HTMLElement>()
const naiveBall = ref<HTMLElement>()
const dtBall = ref<HTMLElement>()
const loadMs = ref(0)
const s = reactive({ fps: 0, naiveLap: 0, dtLap: 0 })

const LAP_SECONDS = 2
const ASSUMED_FPS = 60 // what the naive version silently assumes

let rafId = 0
let last: number | undefined
let naiveX = 0
let dtX = 0
let naiveLapStart = 0
let dtLapStart = 0
const frameTimes = new Samples(30)

function frame(now: number) {
  const raw = last === undefined ? 0 : now - last
  last = now
  // Clamp: after a stall (tab hidden, debugger pause) don't teleport objects across the screen.
  const dt = Math.min(raw, 100)
  if (raw > 0) frameTimes.push(raw)

  busyWait(loadMs.value) // pretend this frame has heavy work to do

  const width = track.value!.clientWidth - naiveBall.value!.offsetWidth

  // ❌ Per-frame step: the speed is tied to the frame rate.
  naiveX += width / (LAP_SECONDS * ASSUMED_FPS)
  if (naiveX >= width) {
    naiveX -= width
    s.naiveLap = (now - naiveLapStart) / 1000
    naiveLapStart = now
  }

  // ✅ Delta time: the speed is tied to real time.
  dtX += (width / LAP_SECONDS) * (dt / 1000)
  if (dtX >= width) {
    dtX -= width
    s.dtLap = (now - dtLapStart) / 1000
    dtLapStart = now
  }

  naiveBall.value!.style.translate = `${naiveX}px 0`
  dtBall.value!.style.translate = `${dtX}px 0`
  const typical = median(frameTimes.values)
  s.fps = typical ? 1000 / typical : 0

  rafId = requestAnimationFrame(frame)
}

const { running, toggle } = useDemo('delta', {
  start() {
    last = undefined
    naiveX = dtX = 0
    naiveLapStart = dtLapStart = performance.now()
    Object.assign(s, { naiveLap: 0, dtLap: 0 })
    frameTimes.clear()
    rafId = requestAnimationFrame(frame)
  },
  stop: () => cancelAnimationFrame(rafId),
})

const lapClass = (t: number) => (!t ? '' : Math.abs(t - LAP_SECONDS) < 0.15 ? 'good' : 'bad')

const code = `function frame(now) {
  const dt = Math.min(now - last, 100) // ms since previous frame, clamped
  last = now

  // ❌ x += 5                       → speed depends on frame rate
  // ✅ x += pxPerSecond * dt / 1000 → speed depends on time

  requestAnimationFrame(frame)
}`
</script>

<template>
  <DemoCard id="delta" :step="3" title="Delta time: same speed on any device" :running :code @toggle="toggle">
    <template #lesson>
      <p>
        rAF runs as often as the device can manage: 60, 120 or 144 times a second, and fewer when the page is
        busy. Moving “5 px per frame” therefore moves at different speeds on different machines. Use the
        timestamp to move by <em>time elapsed</em> instead. Both balls should finish a lap every
        <strong>{{ LAP_SECONDS }} s</strong>.
      </p>
    </template>

    <label class="slider">
      <span>Extra work per frame: <strong>{{ loadMs }} ms</strong></span>
      <input v-model.number="loadMs" type="range" min="0" max="45" step="1" />
    </label>

    <div ref="track" class="lanes">
      <div class="lane"><span class="lane-label">x += step</span><div ref="naiveBall" class="ball warn" /></div>
      <div class="lane"><span class="lane-label">x += v · dt</span><div ref="dtBall" class="ball" /></div>
    </div>

    <dl class="stats">
      <div><dt>Frame rate</dt><dd>{{ s.fps.toFixed(0) }} fps</dd></div>
      <div><dt>Per-frame lap</dt><dd :class="lapClass(s.naiveLap)">{{ s.naiveLap ? `${s.naiveLap.toFixed(2)} s` : '…' }}</dd></div>
      <div><dt>Delta-time lap</dt><dd :class="lapClass(s.dtLap)">{{ s.dtLap ? `${s.dtLap.toFixed(2)} s` : '…' }}</dd></div>
    </dl>

    <template #takeaway>
      <p>
        Drag the slider to ~30 ms and the frame rate collapses. The per-frame ball slows to a crawl, while the
        delta-time ball still laps in {{ LAP_SECONDS }} s; it just moves in bigger hops. On a 120 Hz screen, the
        per-frame ball runs <em>twice</em> as fast even with no load.
      </p>
    </template>
  </DemoCard>
</template>
