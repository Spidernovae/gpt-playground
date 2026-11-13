/**
 * CHALLENGE: Flick the puck
 * ─────────────────────────
 * Build a puck you can drag and throw. After release it glides, slows down from friction,
 * bounces off the walls, and comes to rest.
 *
 * Rules (each one is a rAF lesson in disguise):
 *  1. While dragging, the puck follows the pointer, but you may write its style at most
 *     ONCE per frame (HUD: "style writes/frame" ≤ 1). Don't write styles inside pointermove.
 *  2. The release speed comes from how fast the pointer was really moving at the moment
 *     you let go (measured in px/second, not px/event).
 *  3. Friction and movement must not depend on frame rate. The same flick has to glide the
 *     same distance at 60 Hz, 120 Hz, or with DevTools → Performance → CPU 6× slowdown.
 *  4. Bounce off all four walls, losing 20% of speed on each bounce.
 *  5. When the puck has stopped (< 5 px/s), the loop must STOP. HUD: "rAF loop running: no".
 *  6. Grabbing the puck mid-glide catches it instantly: the glide loop is cancelled,
 *     and there's never more than one loop running.
 *  7. Switch tabs mid-glide and come back: the puck must not teleport through a wall.
 *
 * Start with: the HUD helpers below, `translate` for positioning, pointer events with
 * setPointerCapture, and performance.now() / the rAF timestamp for time.
 *
 * Run: make raf-lab, then open /challenge.html
 */
import { hud } from './hud'

const table = document.getElementById('table')!
const puck = document.getElementById('puck')!

// Suggested state. Change it however you like.
const state = {
  x: 40,
  y: 40,
  vx: 0, // px per second
  vy: 0,
}

function render() {
  hud.styleWrite()
  puck.style.translate = `${state.x}px ${state.y}px`
}

render()

let grabX = 0, grabY = 0
let dragging = false

puck.addEventListener('pointerdown', (e) => {
  puck.setPointerCapture(e.pointerId)
  dragging = true
  const r = table.getBoundingClientRect()
  grabX = (e.clientX - r.left) - state.x   // pointer pos in table − puck pos
  grabY = (e.clientY - r.top)  - state.y
})

puck.addEventListener('pointermove', (e) => {
  if (!dragging) return                     // ignore plain hovering
  const r = table.getBoundingClientRect()
  state.x = e.clientX - r.left - grabX
  state.y = e.clientY - r.top  - grabY
  render()
})

puck.addEventListener('pointerup', () => console.log('up'))

// TODO: your code here.
let now
function frame(now) {
  hud.frame()
  
  requestAnimationFrame(frame)
}


