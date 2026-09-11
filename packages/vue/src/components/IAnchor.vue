<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IAnchor.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { activeAnchor, anchorScrollTop, rafThrottle, type AnchorTarget } from '@i-design/common'

export interface AnchorItem {
  key: string
  label: string
  /** 标题层级，用于缩进；2 为一级 */
  level?: number
}

const props = withDefaults(
  defineProps<{
    items: AnchorItem[]
    /** 判定线相对视口顶端的偏移，通常等于吸顶导航高度 */
    offset?: number
  }>(),
  { offset: 80 }
)

const emit = defineEmits<{ (e: 'change', a0: key: string): void }>()
const active = ref('')

function measure(): AnchorTarget[] {
  return props.items
    .map((item) => {
      const el = document.getElementById(item.key)
      return el ? { key: item.key, top: el.getBoundingClientRect().top + window.scrollY } : null
    })
    .filter((t): t is AnchorTarget => t !== null)
}

/*
 * 合并到每帧一次：measure() 会把每个锚点的 rect 量一遍，
 * 而滚动事件一次滑动能打出上百个——不合并的话主线程全耗在测量上，
 * 手指划得动、页面跟不上。
 */
const onScroll = rafThrottle(() => update())

function update() {
  const next = activeAnchor(measure(), {
    scrollTop: window.scrollY,
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight,
    offset: props.offset
  })
  if (next !== active.value) {
    active.value = next
    emit('change', next)
  }
}

function jump(key: string, event: MouseEvent) {
  event.preventDefault()
  const el = document.getElementById(key)
  if (!el) return
  window.scrollTo({
    top: anchorScrollTop(el.getBoundingClientRect().top + window.scrollY, props.offset),
    behavior: 'smooth'
  })
  // 立即更新高亮：平滑滚动期间不等滚动事件，否则点了半天没反应
  active.value = key
  emit('change', key)
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  onScroll.cancel()
})
</script>

<template>
  <nav class="i-anchor" aria-label="页内导航">
    <ul class="i-anchor__list">
      <li v-for="item in items" :key="item.key">
        <a
          class="i-anchor__link"
          :class="{ 'is-active': active === item.key }"
          :href="`#${item.key}`"
          :data-level="item.level ?? 2"
          :aria-current="active === item.key ? 'location' : undefined"
          @click="jump(item.key, $event)"
        >
          {{ item.label }}
        </a>
      </li>
    </ul>
  </nav>
</template>
