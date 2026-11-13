/**
 * Self-check panel. Don't change this file. Route your DOM access through it so it can spot
 * mistakes for you:
 *
 *   hud.frame()                    call at the top of every rAF callback
 *   hud.read(() => el.getBoundingClientRect())   wrap every LAYOUT READ
 *     (getBoundingClientRect, offsetTop/Height, scrollTop, clientHeight, ...)
 *   hud.write(() => { el.style.translate = ... })  wrap every DOM/STYLE WRITE
 *     (style changes, scrollTop = ..., moving/inserting elements, classList)
 *
 * A read that comes AFTER a write in the same frame forces the browser to recalculate layout
 * on the spot (a "forced reflow", aka layout thrashing). The HUD counts those. Real-world
 * check: DevTools → Performance → record → look for purple "Forced reflow" warnings.
 */
const el = document.getElementById('hud')!

let wroteThisFrame = false
let frames = 0
let reads = 0
let writes = 0
let forced = 0
let totalForced = 0
let lastFrameAt = 0
let scrollStart: { top: number; at: number } | null = null
let scrollSpeed = 0

export const hud = {
  frame() {
    frames++
    wroteThisFrame = false
    lastFrameAt = performance.now()
  },
  read<T>(fn: () => T): T {
    reads++
    if (wroteThisFrame) {
      forced++
      totalForced++
    }
    return fn()
  },
  write(fn: () => void) {
    writes++
    wroteThisFrame = true
    fn()
  },
}

// Anything outside a rAF callback (event handlers) counts as its own "frame" for the check.
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'keydown'] as const) {
  window.addEventListener(type, () => (wroteThisFrame = false), { capture: true })
}

const list = document.getElementById('list')!
list.addEventListener('scroll', () => {
  const now = performance.now()
  if (scrollStart && now - scrollStart.at > 0) {
    scrollSpeed = ((list.scrollTop - scrollStart.top) / (now - scrollStart.at)) * 1000
  }
  scrollStart = { top: list.scrollTop, at: now }
})

setInterval(() => {
  const loopAlive = performance.now() - lastFrameAt < 250
  if (scrollStart && performance.now() - scrollStart.at > 150) scrollSpeed = 0
  el.textContent = [
    `rAF loop running   : ${loopAlive ? 'YES' : 'no (idle)'}`,
    `frames / second    : ${frames}`,
    `reads / writes /s  : ${reads} / ${writes}`,
    `forced reflows /s  : ${forced}${forced ? '   ⚠ read after write' : ''}`,
    `forced reflows all : ${totalForced}`,
    `list scroll speed  : ${Math.round(scrollSpeed)} px/s`,
  ].join('\n')
  frames = reads = writes = forced = 0
}, 1000)
