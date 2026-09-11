<script setup lang="ts">
import { computed, ref } from 'vue'
import ICell from './ICell.vue'
import { activeIndexAt, groupByIndex } from '@i-design/common'

/**
 * 索引列表：通讯录那种「右侧 A–Z、点哪跳哪」的列表。
 *
 * 分组与定位的规则在 logic/indexes：中文转拼音由调用方给 key，
 * 组件不替它决定用哪套词库（「重庆」归 C 还是 Z 取决于那套表）。
 */
const props = defineProps<{
  items: { key: string; label: string; description?: string }[]
}>()

const emit = defineEmits<{ select: [{ key: string; label: string }] }>()

const groups = computed(() => groupByIndex(props.items, (item) => item.key))
const active = ref('')
const hint = ref('')
const root = ref<HTMLElement>()

function onScroll() {
  const el = root.value
  if (!el) return
  const offsets = [...el.querySelectorAll<HTMLElement>('[data-index]')].map((node) => ({
    index: node.dataset.index!,
    top: node.offsetTop
  }))
  active.value = activeIndexAt(offsets, el.scrollTop)
}

function jump(index: string) {
  const target = root.value?.querySelector<HTMLElement>(`[data-index="${index}"]`)
  if (!target || !root.value) return
  root.value.scrollTop = target.offsetTop
  active.value = index
}

/* 手指压住索引条滑动：中途一直跟着跳，松手才收起提示 */
function onBarMove(event: TouchEvent) {
  const touch = event.touches[0]
  const node = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
  const letter = node?.dataset?.letter
  if (!letter || letter === hint.value) return
  hint.value = letter
  jump(letter)
}
</script>

<template>
  <div class="i-indexes">
    <div class="i-indexes__scroll" ref="root" @scroll="onScroll">
      <template v-for="group in groups" :key="group.index">
        <p class="i-indexes__title" :data-index="group.index">{{ group.index }}</p>
        <!-- 行本身就是 ICell：手抄一遍它的类名，改动 ICell 时这里不会跟着变 -->
        <ICell
          v-for="item in group.items"
          :key="item.label"
          :title="item.label"
          :description="item.description"
          clickable
          @click="emit('select', item)"
        />
      </template>
    </div>

    <nav
      class="i-indexes__bar"
      aria-label="索引"
      @touchstart.prevent="onBarMove"
      @touchmove.prevent="onBarMove"
      @touchend="hint = ''"
      @touchcancel="hint = ''"
    >
      <span
        v-for="group in groups"
        :key="group.index"
        class="i-indexes__letter"
        :class="{ 'is-active': active === group.index }"
        :data-letter="group.index"
        @click="jump(group.index)"
        >{{ group.index }}</span
      >
    </nav>

    <!-- 手指压住索引条时，那个字母正好被手挡住，因此在屏幕中央再显示一次 -->
    <div v-if="hint" class="i-indexes__hint" aria-hidden="true">{{ hint }}</div>
  </div>
</template>
