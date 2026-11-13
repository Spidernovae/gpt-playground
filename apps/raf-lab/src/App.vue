<script setup lang="ts">
import LoopAnatomy from './demos/LoopAnatomy.vue'
import IntervalVsRaf from './demos/IntervalVsRaf.vue'
import DeltaTime from './demos/DeltaTime.vue'
import BatchUpdates from './demos/BatchUpdates.vue'
import HiddenTab from './demos/HiddenTab.vue'
import ParticleField from './demos/ParticleField.vue'

const stages = [
  { name: 'Input', note: 'click, pointer, scroll' },
  { name: 'Tasks', note: 'timers, fetch, messages' },
  { name: 'rAF callbacks', note: 'you are here', highlight: true },
  { name: 'Style', note: 'recalc CSS' },
  { name: 'Layout', note: 'geometry' },
  { name: 'Paint', note: 'pixels' },
  { name: 'Composite', note: 'to screen' },
]
const nav = [
  ['anatomy', 'The loop'],
  ['interval', 'vs setInterval'],
  ['delta', 'Delta time'],
  ['batch', 'Batching'],
  ['hidden', 'Hidden tabs'],
  ['particles', 'Particles'],
]
</script>

<template>
  <header class="hero">
    <h1>requestAnimationFrame lab</h1>
    <p class="lede">
      Six small experiments that show what <code>requestAnimationFrame</code> does and why it beats timers for
      anything that moves. Each one has a <strong>Run</strong> button, and only one runs at a time so the
      measurements stay honest.
    </p>
    <nav aria-label="Experiments">
      <a v-for="[id, label] in nav" :key="id" :href="`#${id}`">{{ label }}</a>
    </nav>
  </header>

  <main>
    <section class="card" aria-labelledby="frame-title">
      <h2 id="frame-title">Where rAF lives: inside one frame</h2>
      <p>
        Roughly 60–120 times a second the browser produces a frame. rAF callbacks run at a fixed point in that
        cycle: <strong>after</strong> tasks and input, <strong>right before</strong> the browser computes styles,
        lays out and paints. Whatever you change there is painted in that same frame, exactly once.
      </p>
      <ol class="pipeline">
        <li v-for="s in stages" :key="s.name" :class="{ hl: s.highlight }">
          <strong>{{ s.name }}</strong><span>{{ s.note }}</span>
        </li>
      </ol>
      <p class="muted">
        A timer, by contrast, can fire anywhere: twice in one frame (wasted work), or not at all in a frame
        (a visible stall).
      </p>
    </section>

    <LoopAnatomy />
    <IntervalVsRaf />
    <DeltaTime />
    <BatchUpdates />
    <HiddenTab />
    <ParticleField />

    <section class="card" aria-labelledby="rules-title">
      <h2 id="rules-title">Cheat sheet</h2>
      <ul class="rules">
        <li><strong>Use rAF</strong> for JS-driven visuals: canvas/WebGL, games, physics, charts, drag-follow.</li>
        <li><strong>Move by time, not by frames:</strong> <code>x += speed * dt</code>, and clamp <code>dt</code>.</li>
        <li><strong>Batch:</strong> store incoming data and render once per frame using a dirty flag.</li>
        <li><strong>It's one-shot:</strong> re-request inside the callback; keep the id to <code>cancelAnimationFrame</code>.</li>
        <li><strong>Stay in budget:</strong> callback + style + layout + paint ≤ 16.7 ms (8.3 ms at 120 Hz).</li>
        <li>
          <strong>Don't reach for it first</strong> for simple UI motion: CSS transitions/animations, the Web
          Animations API and scroll-driven animations can run on the compositor, off the main thread.
        </li>
        <li><strong>Give users a pause button</strong>, and don't autoplay motion for people who prefer reduced motion.</li>
      </ul>
    </section>
  </main>
</template>
