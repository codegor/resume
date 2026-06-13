<template>
  <svg
    ref="rootEl"
    class="tl-spine"
    :width="dimW"
    :height="dimH"
    :viewBox="'0 0 ' + dimW + ' ' + dimH"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="spineGrad" x1="0" y1="0" x2="0" :y2="dimH" gradientUnits="userSpaceOnUse">
        <stop v-for="(s, i) in stops" :key="i" :offset="s.off" :stop-color="'var(' + s.c + ')'" />
      </linearGradient>
    </defs>
    <path :d="d" stroke="var(--line)" stroke-width="2.5" opacity="0.5"></path>
    <path
      ref="path"
      :d="d"
      stroke="url(#spineGrad)"
      stroke-width="2.5"
      stroke-linecap="round"
      :style="{
        strokeDasharray: len,
        strokeDashoffset: drawn ? 0 : len,
        transition: 'stroke-dashoffset 1.8s cubic-bezier(.4,.1,.2,1)',
      }"
    ></path>
  </svg>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ recomputeKey?: string }>()

const d = ref('')
const len = ref(0)
const stops = ref<{ off: number; c: string }[]>([])
const dimW = ref(0)
const dimH = ref(0)
const drawn = ref(false)

const rootEl = ref<SVGSVGElement | null>(null)
const path = ref<SVGPathElement | null>(null)

let _ro: ResizeObserver | undefined
let _io: IntersectionObserver | undefined
let _onResize: (() => void) | undefined
let _onZoom: (() => void) | undefined
let _raf: number | undefined
let _t1: number | undefined
let _t2: number | undefined

// The spine is measured from .epoch-dot DOM positions, which keep shifting as fonts,
// lazy images and reveal animations settle after mount. We recompute twice on a delay
// to catch the layout once it's stable (early + late safety net).
const SETTLE_EARLY_MS = 400
const SETTLE_LATE_MS = 1200

function recompute() {
  const cont = rootEl.value && rootEl.value.parentElement
  if (!cont) return
  const dots = [...cont.querySelectorAll('.epoch-dot')].filter(
    (el) => (el as HTMLElement).offsetParent !== null,
  ) as HTMLElement[]
  if (dots.length < 1) return
  const cb = cont.getBoundingClientRect()
  const pts = dots.map((el) => {
    const r = el.getBoundingClientRect()
    return {
      x: r.left - cb.left + r.width / 2,
      y: r.top - cb.top + r.height / 2,
      c: el.dataset.color,
    }
  })
  let pathStr = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1)
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1],
      p1 = pts[i],
      dy = p1.y - p0.y,
      c1y = p0.y + dy * 0.5,
      c2y = p1.y - dy * 0.5
    pathStr +=
      ' C ' +
      p0.x.toFixed(1) +
      ' ' +
      c1y.toFixed(1) +
      ', ' +
      p1.x.toFixed(1) +
      ' ' +
      c2y.toFixed(1) +
      ', ' +
      p1.x.toFixed(1) +
      ' ' +
      p1.y.toFixed(1)
  }
  // stop the spine just past the last era, not at the very bottom of the section
  const groups = cont.querySelectorAll('.epoch-group')
  const lastG = groups[groups.length - 1]
  let endY = cont.scrollHeight
  if (lastG) {
    const gr = lastG.getBoundingClientRect()
    endY = Math.min(endY, gr.bottom - cb.top - 14)
  }
  pathStr += ' L ' + pts[pts.length - 1].x.toFixed(1) + ' ' + endY.toFixed(1)
  d.value = pathStr
  dimW.value = cb.width
  dimH.value = cont.scrollHeight
  const H = cont.scrollHeight || 1
  stops.value = pts.map((p) => ({ off: Math.max(0, Math.min(1, p.y / H)), c: p.c! }))
}

onMounted(() => {
  recompute()
  const cont = rootEl.value!.parentElement
  if (cont && window.ResizeObserver) {
    _ro = new ResizeObserver(() => recompute())
    _ro.observe(cont)
  }
  _onResize = () => recompute()
  window.addEventListener('resize', _onResize)
  // recompute on (pinch/page) zoom so the spine length stays correct
  _onZoom = () => {
    cancelAnimationFrame(_raf!)
    _raf = requestAnimationFrame(() => recompute())
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', _onZoom)
    window.visualViewport.addEventListener('scroll', _onZoom)
  }
  _t1 = setTimeout(() => recompute(), SETTLE_EARLY_MS)
  _t2 = setTimeout(() => recompute(), SETTLE_LATE_MS)
  if (cont) {
    _io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) drawn.value = true
        }),
      { threshold: 0.05 },
    )
    _io.observe(cont)
  }
})

onBeforeUnmount(() => {
  _ro && _ro.disconnect()
  _io && _io.disconnect()
  if (_onResize) window.removeEventListener('resize', _onResize)
  if (window.visualViewport && _onZoom) {
    window.visualViewport.removeEventListener('resize', _onZoom)
    window.visualViewport.removeEventListener('scroll', _onZoom)
  }
  cancelAnimationFrame(_raf!)
  clearTimeout(_t1)
  clearTimeout(_t2)
})

watch(
  () => props.recomputeKey,
  () => {
    recompute()
    nextTick(() => {
      _t1 = setTimeout(() => recompute(), SETTLE_EARLY_MS)
    })
  },
)
watch(d, () => {
  nextTick(() => {
    const p = path.value
    if (p && d.value) len.value = p.getTotalLength()
  })
})
</script>
