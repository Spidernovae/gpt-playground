/** Freeze the main thread for `ms`, simulating expensive JS (layout, parsing, heavy math). */
export function busyWait(ms: number) {
  const end = performance.now() + ms
  while (performance.now() < end) {
    /* spin */
  }
}

export function median(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

/** Fixed-size ring of recent samples. */
export class Samples {
  readonly values: number[] = []
  private readonly size: number
  constructor(size = 120) {
    this.size = size
  }
  push(v: number) {
    this.values.push(v)
    if (this.values.length > this.size) this.values.shift()
  }
  clear() {
    this.values.length = 0
  }
}

/** Size a canvas's backing store to its CSS size × devicePixelRatio, so lines stay crisp. */
export function fitCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const w = Math.round(canvas.clientWidth * dpr)
  const h = Math.round(canvas.clientHeight * dpr)
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, width: canvas.clientWidth, height: canvas.clientHeight }
}

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/**
 * Bar chart of frame durations. Reference lines mark the 60 Hz (16.7 ms) and 120 Hz (8.3 ms)
 * budgets; bars over 1.5× the median are drawn in the "long frame" color.
 */
export function drawFrameGraph(canvas: HTMLCanvasElement, frameTimes: number[], maxMs = 50) {
  const { ctx, width, height } = fitCanvas(canvas)
  ctx.clearRect(0, 0, width, height)
  const y = (ms: number) => height - (Math.min(ms, maxMs) / maxMs) * height

  ctx.strokeStyle = css('--border')
  ctx.fillStyle = css('--muted')
  ctx.font = '11px system-ui'
  ctx.lineWidth = 1
  for (const [ms, label] of [
    [16.7, '16.7 ms · 60 fps'],
    [8.3, '8.3 ms · 120 fps'],
  ] as const) {
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.moveTo(0, y(ms))
    ctx.lineTo(width, y(ms))
    ctx.stroke()
    ctx.fillText(label, 4, y(ms) - 3)
  }
  ctx.setLineDash([])

  const typical = median(frameTimes)
  const barW = width / Math.max(frameTimes.length, 120)
  frameTimes.forEach((ms, i) => {
    ctx.fillStyle = ms > typical * 1.5 ? css('--bad') : css('--accent')
    ctx.fillRect(i * barW, y(ms), Math.max(barW - 1, 1), height - y(ms))
  })
}
