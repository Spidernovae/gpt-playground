/**
 * Minimal smooth scroll driven by native scroll but rendered with easing.
 * - Keeps native scroll (no wheel hijack)
 * - Applies transform to a wrapper to create buttery motion
 */
export class SmoothScroller {
  private wrapper: HTMLElement
  private rafId = 0
  private targetY = 0
  private currentY = 0
  private ease = 0.12
  private onRaf = this.tick.bind(this)
  private resizeObserver?: ResizeObserver

  constructor(wrapper: HTMLElement, ease = 0.12) {
    this.wrapper = wrapper
    this.ease = ease
  }

  mount() {
    // Prepare
    this.wrapper.style.willChange = 'transform'
    this.wrapper.style.transform = 'translate3d(0,0,0)'
    document.body.style.height = `${this.wrapper.scrollHeight}px`

    // Update body height when content changes
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        document.body.style.height = `${this.wrapper.scrollHeight}px`
      })
      this.resizeObserver.observe(this.wrapper)
    }

    // Start loop
    this.rafId = requestAnimationFrame(this.onRaf)
    window.addEventListener('resize', this.onResize, { passive: true })
  }

  unmount() {
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.onResize)
    this.resizeObserver?.disconnect()
    // Cleanup styles
    this.wrapper.style.willChange = ''
    this.wrapper.style.transform = ''
    document.body.style.height = ''
  }

  private tick() {
    this.targetY = window.scrollY || window.pageYOffset
    this.currentY += (this.targetY - this.currentY) * this.ease
    if (Math.abs(this.targetY - this.currentY) < 0.1) this.currentY = this.targetY
    this.wrapper.style.transform = `translate3d(0, ${-this.currentY}px, 0)`
    this.rafId = requestAnimationFrame(this.onRaf)
  }

  private onResize = () => {
    document.body.style.height = `${this.wrapper.scrollHeight}px`
  }
}

export function shouldEnableSmooth(): boolean {
  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return !prefersReduced
}


