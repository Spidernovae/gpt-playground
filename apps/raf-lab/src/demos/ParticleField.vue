<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import DemoCard from '../components/DemoCard.vue'
import { useDemo } from '../lib/demo'
import { fitCanvas, median, Samples } from '../lib/frames'

const box = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const count = ref(3000)
const s = reactive({ fps: 0, onScreen: true })
const pauses = ref<{ seconds: number; framesSaved: number }[]>([])

interface P { x: number; y: number; vx: number; vy: number; hue: number }
let particles: P[] = []
let rafId = 0
let last: number | undefined
let looping = false
let active = false
let pausedAt = 0
const frameTimes = new Samples(60)
const pointer = { x: -1e4, y: -1e4 }

function seed(width: number, height: number) {
  particles = Array.from({ length: count.value }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 120,
    vy: (Math.random() - 0.5) * 120,
    hue: 200 + Math.random() * 80,
  }))
}

function frame(now: number) {
  const raw = last === undefined ? 0 : now - last
  last = now
  if (raw) frameTimes.push(raw)
  const dt = Math.min(raw, 100) / 1000 // seconds, clamped

  const { ctx, width, height } = fitCanvas(canvas.value!)
  if (particles.length !== count.value) seed(width, height)

  ctx.clearRect(0, 0, width, height)
  for (const p of particles) {
    // Push away from the pointer, in px/s², scaled by dt like everything else.
    const dx = p.x - pointer.x
    const dy = p.y - pointer.y
    const d2 = dx * dx + dy * dy
    if (d2 < 10000) {
      const f = (1 - d2 / 10000) * 2400 * dt
      p.vx += (dx / Math.sqrt(d2 + 1)) * f
      p.vy += (dy / Math.sqrt(d2 + 1)) * f
    }
    p.vx *= 1 - 0.6 * dt
    p.vy *= 1 - 0.6 * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.x < 0 || p.x > width) p.vx *= -1
    if (p.y < 0 || p.y > height) p.vy *= -1
    p.x = Math.min(Math.max(p.x, 0), width)
    p.y = Math.min(Math.max(p.y, 0), height)
    ctx.fillStyle = `hsl(${p.hue} 90% 60%)`
    ctx.fillRect(p.x, p.y, 2, 2)
  }
  const typical = median(frameTimes.values)
  s.fps = typical ? 1000 / typical : 0
  rafId = requestAnimationFrame(frame)
}

/** Run the loop only if the experiment is on AND the browser is actually rendering it. */
function sync() {
  const shouldRun = active && s.onScreen
  if (shouldRun && !looping) {
    looping = true
    last = undefined
    if (pausedAt) {
      const seconds = (performance.now() - pausedAt) / 1000
      const fps = median(frameTimes.values) ? 1000 / median(frameTimes.values) : 60
      pauses.value.unshift({ seconds, framesSaved: Math.round(seconds * fps) })
      pausedAt = 0
    }
    rafId = requestAnimationFrame(frame)
  } else if (!shouldRun && looping) {
    looping = false
    cancelAnimationFrame(rafId)
    if (active) pausedAt = performance.now() // paused because it scrolled away
  }
}

const { running, toggle } = useDemo('particles', {
  start() {
    active = true
    pauses.value = []
    sync()
  },
  stop() {
    active = false
    pausedAt = 0
    sync()
  },
})

// rAF already pauses in hidden tabs, but NOT when an element is merely scrolled off-screen.
// content-visibility: auto tells us when the browser skips rendering it, so we pause too.
function onVisibilityState(e: Event) {
  s.onScreen = !(e as Event & { skipped: boolean }).skipped
  sync()
}
let observer: IntersectionObserver | undefined
onMounted(() => {
  const el = box.value!
  if ('contentVisibility' in document.documentElement.style) {
    el.addEventListener('contentvisibilityautostatechange', onVisibilityState)
  } else {
    observer = new IntersectionObserver(
      ([entry]) => {
        s.onScreen = entry?.isIntersecting ?? true
        sync()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
  }
})
onBeforeUnmount(() => {
  box.value?.removeEventListener('contentvisibilityautostatechange', onVisibilityState)
  observer?.disconnect()
})

function onPointer(e: PointerEvent) {
  const rect = canvas.value!.getBoundingClientRect()
  pointer.x = e.clientX - rect.left
  pointer.y = e.clientY - rect.top
}
function onLeave() {
  pointer.x = pointer.y = -1e4
}

const code = `/* CSS */ .stage { content-visibility: auto; contain-intrinsic-size: auto 420px; }

stage.addEventListener('contentvisibilityautostatechange', (e) => {
  if (e.skipped) cancelAnimationFrame(id)        // scrolled far away
  else id = requestAnimationFrame(frame)         // about to be visible again
})`
</script>

<template>
  <DemoCard id="particles" :step="6" title="Putting it together: thousands of particles" :running :code @toggle="toggle">
    <template #lesson>
      <p>
        One rAF loop updates and draws every particle per frame: delta-time physics, clamped, drawn to a canvas.
        Move your pointer over it. Then <strong>scroll this section out of view</strong>. rAF doesn't stop for
        off-screen elements by itself, so this demo pauses using
        <code>content-visibility: auto</code>.
      </p>
    </template>

    <label class="slider">
      <span>Particles: <strong>{{ count.toLocaleString() }}</strong> · {{ s.fps.toFixed(0) }} fps</span>
      <input v-model.number="count" type="range" min="500" max="30000" step="500" />
    </label>

    <div ref="box" class="particle-box">
      <canvas
        ref="canvas"
        class="particles"
        role="img"
        aria-label="Particle simulation that reacts to the pointer"
        @pointermove="onPointer"
        @pointerleave="onLeave"
      />
    </div>

    <ul v-if="pauses.length" class="pause-log">
      <li v-for="(p, i) in pauses" :key="i">
        Paused while off-screen for <strong>{{ p.seconds.toFixed(1) }} s</strong>, skipping
        ~{{ p.framesSaved.toLocaleString() }} frames of work.
      </li>
    </ul>

    <template #takeaway>
      <p>
        Push the slider until the fps drops: that's your device's budget per frame. Everything you do in a rAF
        callback, plus style, layout and paint, has to fit in 16.7 ms (or 8.3 ms at 120 Hz).
      </p>
    </template>
  </DemoCard>
</template>
