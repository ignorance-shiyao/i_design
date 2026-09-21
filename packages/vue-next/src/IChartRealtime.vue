<script setup lang="ts">
import { computed } from 'vue'
import type { RealtimeModel } from '@i-design/common'
import IIcon from './IIcon.vue'

const props = withDefaults(defineProps<{
  /** buildRealtimeWindow 生成的同源模型，可直接序列化给其他端 */
  model: RealtimeModel
  title?: string
  selectedIndex?: number | null
  height?: number
}>(), { title: '实时滑窗', selectedIndex: null, height: 180 })
const emit = defineEmits<{ select: [index: number] }>()

const span = computed(() => props.model.max - props.model.min || 1)
const yOf = (value: number) => 100 - ((value - props.model.min) / span.value) * 100
const xOf = (index: number, count: number) => (count <= 1 ? 50 : (index / (count - 1)) * 100)

/*
 * 折线在断流桶处断开：连过去会把空档画成从上一值插到下一值，
 * 看起来像流量慢慢掉下去又爬上来，而其实那段根本没数。
 */
const segments = computed(() => {
  const buckets = props.model.buckets
  const lines: string[] = []
  let points: string[] = []
  buckets.forEach((bucket, index) => {
    if (bucket.state === 'gap' || bucket.value === null) {
      if (points.length) lines.push(points.join(' '))
      points = []
      return
    }
    points.push(`${xOf(index, buckets.length)},${yOf(bucket.value)}`)
  })
  if (points.length) lines.push(points.join(' '))
  return lines
})

const gapBands = computed(() =>
  props.model.buckets
    .map((bucket, index) => ({ bucket, index }))
    .filter((row) => row.bucket.state === 'gap')
    .map(({ index }) => {
      const count = props.model.buckets.length
      const left = count <= 1 ? 0 : ((index - 0.5) / (count - 1)) * 100
      const right = count <= 1 ? 100 : ((index + 0.5) / (count - 1)) * 100
      return { index, x: Math.max(0, left), width: Math.min(100, right) - Math.max(0, left) }
    })
)

const gapCount = computed(() => props.model.buckets.filter((bucket) => bucket.state === 'gap').length)
const zeroY = computed(() => yOf(0))
</script>

<template>
  <figure class="i-realtime">
    <figcaption class="i-realtime__title">{{ title }}</figcaption>
    <p class="i-realtime__caption">{{ model.caption }}</p>
    <p class="i-realtime__basis">口径：{{ model.basis }}</p>

    <div class="i-realtime__status" aria-label="运行状态">
      <span class="i-realtime__chip" :class="model.paused ? 'is-paused' : 'is-live'">
        <IIcon :name="model.paused ? 'warning-triangle' : 'check-circle'" :size="14" />
        {{ model.paused ? '已暂停' : '直播中' }}
      </span>
      <span class="i-realtime__chip">{{ model.lagText }}</span>
      <span v-if="gapCount" class="i-realtime__chip is-gap">
        <IIcon name="offline" :size="14" />
        {{ gapCount }} 个断流空档
      </span>
    </div>

    <template v-if="model.state === 'ready'">
      <!--
        position: relative 顶住读屏专用文本的包含块——
        绝对定位的 sr 文本如果冒泡到页面，窄屏会把整页撑出横向滚动。
      -->
      <div class="i-realtime__plot">
        <svg
          class="i-realtime__svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          :style="{ height: `${height}px` }"
          role="img"
          :aria-label="`${title}。${model.caption}。${model.basis}`"
        >
          <line v-for="y in [0, 25, 50, 75, 100]" :key="y" class="i-realtime__grid" x1="0" x2="100" :y1="y" :y2="y" />
          <line class="i-realtime__zero" x1="0" x2="100" :y1="zeroY" :y2="zeroY" />
          <g v-for="band in gapBands" :key="`gap-${band.index}`">
            <rect class="i-realtime__gap" :x="band.x" y="0" :width="Math.max(band.width, 1)" height="100" />
            <text class="i-realtime__gap-label" :x="band.x + band.width / 2" y="14" text-anchor="middle">断流</text>
          </g>
          <line
            v-for="mark in model.marks"
            :key="`mark-${mark.id}`"
            class="i-realtime__mark"
            :x1="xOf(mark.bucketIndex, model.buckets.length)"
            :x2="xOf(mark.bucketIndex, model.buckets.length)"
            y1="0"
            y2="100"
          />
          <text
            v-for="mark in model.marks"
            :key="`mark-label-${mark.id}`"
            class="i-realtime__mark-label"
            :x="xOf(mark.bucketIndex, model.buckets.length) + 1"
            y="26"
          >{{ mark.label }}</text>
          <polyline v-for="(line, i) in segments" :key="i" class="i-realtime__line" :points="line" />
          <circle
            v-for="(bucket, index) in model.buckets"
            v-show="bucket.state === 'ready' && bucket.value !== null"
            :key="`pt-${index}`"
            class="i-realtime__point"
            :class="{ 'is-selected': selectedIndex === index }"
            :cx="xOf(index, model.buckets.length)"
            :cy="yOf(bucket.value ?? 0)"
            r="1.6"
          />
        </svg>
      </div>

      <ol class="i-realtime__buckets" aria-label="各桶数值">
        <li v-for="bucket in model.buckets" :key="bucket.index">
          <button
            type="button"
            class="i-realtime__bucket"
            :class="{ 'is-selected': selectedIndex === bucket.index, 'is-gap': bucket.state === 'gap' }"
            :aria-label="bucket.description"
            :aria-pressed="selectedIndex === bucket.index"
            @click="emit('select', bucket.index)"
          >
            <span class="i-realtime__bucket-state">{{ bucket.state === 'gap' ? '断流' : `桶 ${bucket.index + 1}` }}</span>
            <span class="i-realtime__bucket-value">{{ bucket.valueText }}</span>
            <span class="i-realtime__sr">{{ bucket.description }}</span>
          </button>
        </li>
      </ol>
      <p class="i-realtime__note">折线在断流空档处断开，不把空档连成斜线。下方每个桶都可以选中；断流桶标着「断流」，不是 0。</p>
    </template>

    <ul v-if="model.late.length || model.excluded.length" class="i-realtime__issues" aria-label="未入窗或未计入的点">
      <li v-for="row in model.late" :key="`late-${row.id}`">未入窗 · {{ row.id }}：{{ row.reason }}</li>
      <li v-for="row in model.excluded" :key="`ex-${row.id}`">未计入 · 源行 {{ row.sourceIndex + 1 }} · {{ row.id }}：{{ row.reason }}</li>
    </ul>
  </figure>
</template>
