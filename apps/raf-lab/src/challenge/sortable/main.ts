/**
 * CHALLENGE 2: Sortable backlog with edge auto-scroll
 * ───────────────────────────────────────────────────
 * The everyday version of this: Trello/Jira/Linear boards, playlist editors, form builders,
 * reorderable table columns. Users drag an item, and when they hold it near the top or
 * bottom of a scrolling list, the list scrolls for them.
 *
 * Requirements:
 *  1. Drag a task by its handle. A floating "ghost" copy follows the pointer and a
 *     placeholder line shows where it will land.
 *  2. EDGE AUTO-SCROLL: while the pointer is within 60 px of the list's top/bottom edge, the
 *     list scrolls, faster the closer you are (0 → 900 px/s at the very edge).
 *     It must keep scrolling while the pointer is held perfectly STILL. (No events fire then.
 *     This is the part that's hard without rAF.)
 *  3. Scroll speed is in px/SECOND: the same at 60 Hz, 120 Hz, and with CPU 6× slowdown.
 *     (HUD shows "list scroll speed".)
 *  4. While auto-scrolling, the placeholder keeps updating even though the pointer
 *     hasn't moved, because the items have moved under it.
 *  5. No layout thrashing: each frame, do all layout READS first, then all WRITES.
 *     HUD: "forced reflows /s" stays 0 while dragging. Wrap DOM access in hud.read/hud.write.
 *  6. When nothing is being dragged, no rAF loop is running. HUD: "no (idle)".
 *  7. Dropping commits the new order to `tasks` and calls `saveOrder()`. Pressing Escape or
 *     a `pointercancel` puts everything back exactly as it was, and stops the loop.
 *
 * Bonus (not rAF, but your real-world reviewer will ask):
 *  - Keyboard: focus a handle, press Space to pick up, ↑/↓ to move, Space to drop,
 *    Escape to cancel. Announce moves to screen readers with an aria-live region.
 *  - With 2,000 tasks it should still hold 60 fps. (Change TASK_COUNT.)
 *
 * Run: make raf-lab, then open /sortable.html
 */
import { hud } from './hud'

const TASK_COUNT = 200

interface Task {
  id: string
  title: string
  tag: string
}

const verbs = ['Fix', 'Add', 'Refactor', 'Remove', 'Migrate', 'Test', 'Document', 'Optimize']
const nouns = ['login form', 'cart badge', 'search API', 'date picker', 'invoice PDF', 'avatar upload', 'toast queue', 'feature flag']
const tags = ['bug', 'feature', 'chore', 'perf']

let tasks: Task[] = Array.from({ length: TASK_COUNT }, (_, i) => ({
  id: `T-${100 + i}`,
  title: `${verbs[i % verbs.length]} ${nouns[(i * 7) % nouns.length]}`,
  tag: tags[(i * 3) % tags.length]!,
}))

const list = document.getElementById('list') as HTMLUListElement
const orderEl = document.getElementById('order')!

/** Full re-render from `tasks`. Fine for drop/cancel; too slow to call every frame. */
function renderList() {
  hud.write(() => {
    list.replaceChildren(
      ...tasks.map((t) => {
        const li = document.createElement('li')
        li.className = 'task'
        li.dataset.id = t.id
        li.innerHTML = `
          <button class="handle" type="button" aria-label="Reorder ${t.title}">⠿</button>
          <span class="id">${t.id}</span>
          <span class="title">${t.title}</span>
          <span class="tag">${t.tag}</span>`
        return li
      }),
    )
  })
}

/** Pretend API call. Call it once per successful drop. */
function saveOrder() {
  orderEl.textContent = tasks.map((t) => t.id).join(' → ')
}

renderList()
saveOrder()

// TODO: your code here.
//   Suggested starting point: a `pointerdown` listener on `list` that checks whether
//   (e.target as Element).closest('.handle') was hit, then calls setPointerCapture.
