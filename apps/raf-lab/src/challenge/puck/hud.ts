/**
 * Self-check panel. Don't change this file; use it to verify the acceptance criteria.
 *
 *   hud.frame()            call once at the top of every rAF callback
 *   hud.styleWrite()       call every time you set the puck's style
 *   hud.speed(pxPerSec)    report the current speed
 *   hud.glideStart() / hud.glideEnd()   bracket each glide so its distance gets measured
 *   hud.moved(dx, dy)      report movement during a glide
 */
const el = document.getElementById('hud')!

let framesThisSecond = 0
let writesThisSecond = 0
let lastFrameAt = 0
let fps = 0
let writesPerFrame = 0
let currentSpeed = 0
let gliding = false
let glideDistance = 0
const glides: number[] = []

export const hud = {
  frame() {
    framesThisSecond++
    lastFrameAt = performance.now()
  },
  styleWrite() {
    writesThisSecond++
  },
  speed(pxPerSec: number) {
    currentSpeed = pxPerSec
  },
  glideStart() {
    gliding = true
    glideDistance = 0
  },
  moved(dx: number, dy: number) {
    if (gliding) glideDistance += Math.hypot(dx, dy)
  },
  glideEnd() {
    if (!gliding) return
    gliding = false
    glides.unshift(Math.round(glideDistance))
    glides.length = Math.min(glides.length, 5)
  },
}

// Sample once a second with a plain timer, so the HUD itself never keeps a rAF loop alive.
setInterval(() => {
  fps = framesThisSecond
  writesPerFrame = framesThisSecond ? writesThisSecond / framesThisSecond : writesThisSecond
  framesThisSecond = writesThisSecond = 0
  const loopAlive = performance.now() - lastFrameAt < 250
  el.textContent = [
    `rAF loop running : ${loopAlive ? 'YES' : 'no (idle)'}`,
    `frames / second  : ${fps}`,
    `style writes/frame: ${writesPerFrame.toFixed(2)}${writesPerFrame > 1.01 ? '   ⚠ more than one write per frame' : ''}`,
    `speed            : ${Math.round(currentSpeed)} px/s`,
    `last glides (px) : ${glides.join(', ') || '–'}`,
  ].join('\n')
}, 1000)
