
const onIntersect: IntersectionObserverCallback = (entries, observer) => {
  for (const entry of entries) {
    const el = entry.target as HTMLElement
    if (entry.isIntersecting) {
      el.classList.add('is-visible')
      observer.unobserve(el)
    }
  }
}

const observer = typeof window !== 'undefined' && 'IntersectionObserver' in window
  ? new IntersectionObserver(onIntersect, { root: null, threshold: 0.1 })
  : null

export const vReveal = {
  mounted(el: HTMLElement) {
    el.classList.add('reveal')
    if (observer) {
      observer.observe(el)
    } else {
      // Fallback: show immediately
      el.classList.add('is-visible')
    }
  }
}

export default vReveal


