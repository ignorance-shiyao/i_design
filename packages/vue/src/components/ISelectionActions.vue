<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISelectionActions.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 选区操作：选中一段文字，就地把它交给智能体。
 *
 * **为什么是浮在选区旁边，而不是页面角上的一个按钮。** 选中一段话之后再把
 * 视线挪到别处去找入口，中途很容易碰一下页面把选区清掉——那时用户得重选一遍，
 * 而他并不知道自己做错了什么。浮条跟着选区走，手不用离开刚才那片。
 *
 * **动作条不代替选择，只承接选择。** 它不改选区、不阻止继续拖选；
 * 按 Esc 或点别处就消失，不留任何痕迹。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import IIcon from './IIcon.vue'
import {
  cleanSelection,
  hasSelection,
  selectionAnchor,
  selectionCount,
  selectionExcerpt,
  selectionTooLong,
  type SelectionAction
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 可选中的范围。留空则监听整个文档 */
    actions: SelectionAction[]
    /** 选区上限；超过就只提示、不给动作 */
    max?: number
  }>(),
  { max: 2000 }
)

const emit = defineEmits<{ (e: 'select', payload: { action: SelectionAction; text: string }): void }>()

const rootEl = ref<HTMLElement>()
const barEl = ref<HTMLElement>()
const text = ref('')
const at = ref({ x: 0, y: 0, placement: 'top' as 'top' | 'bottom' })

/* 关掉之后在原地不再弹出：否则点「改写」的那一下会让浮条立刻又出来一次 */
const dismissed = ref(false)

const open = computed(() => !dismissed.value && text.value.length > 0)
const tooLong = computed(() => selectionTooLong(text.value, props.max))
const count = computed(() => selectionCount(text.value))
const excerpt = computed(() => selectionExcerpt(text.value))

function readSelection() {
  const sel = window.getSelection()
  const raw = sel?.toString() ?? ''
  if (!sel || sel.rangeCount === 0 || (!hasSelection(raw, props.max) && !selectionTooLong(raw, props.max))) {
    text.value = ''
    dismissed.value = false
    return
  }
  // 只接管落在自己范围内的选区：整页监听会让页面上任何一处选中都弹出这排按钮
  const range = sel.getRangeAt(0)
  if (rootEl.value && !rootEl.value.contains(range.commonAncestorContainer)) {
    text.value = ''
    return
  }
  text.value = raw
  dismissed.value = false
  place(range)
}

function place(range: Range) {
  const rect = range.getBoundingClientRect()
  // 浮条尺寸取实测值：写死一个宽度的话，动作多一个就夹不回视口了
  const bar = barEl.value?.getBoundingClientRect()
  at.value = selectionAnchor(
    { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    { width: bar?.width || 240, height: bar?.height || 40 },
    { width: window.innerWidth, height: window.innerHeight }
  )
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    dismissed.value = true
    event.stopPropagation()
  }
}

function run(action: SelectionAction) {
  if (action.disabled || tooLong.value) return
  emit('select', { action, text: cleanSelection(text.value) })
  dismissed.value = true
}

onMounted(() => {
  document.addEventListener('selectionchange', readSelection)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', readSelection)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="rootEl" class="i-selact">
    <slot />

    <!--
      浮条用 fixed 定位并挂在原地，而不是传送到 body：传送之后点浮条会先让
      文档失去选区，按钮拿到的就是空字符串了。
    -->
    <div
      v-show="open"
      ref="barEl"
      class="i-selact__bar"
      :class="`i-selact__bar--${at.placement}`"
      :style="{ left: `${at.x}px`, top: `${at.y}px` }"
      role="toolbar"
      aria-label="对选中文字的操作"
      @mousedown.prevent
    >
      <template v-if="tooLong">
        <!-- 说清楚为什么没有按钮：一排灰按钮不告诉用户该怎么办 -->
        <span class="i-selact__hint">
          选中了 {{ count }} 字，超过 {{ max }} 字就不好逐句核对了，选短一些
        </span>
      </template>
      <template v-else>
        <span class="i-selact__quote" :title="excerpt">{{ excerpt }}</span>
        <span class="i-selact__sep" aria-hidden="true" />
        <button
          v-for="action in actions"
          :key="action.id"
          class="i-selact__action"
          type="button"
          :disabled="action.disabled"
          @click="run(action)"
        >
          <IIcon v-if="action.icon" :name="action.icon" :size="13" />
          {{ action.label }}
        </button>
      </template>
    </div>
  </div>
</template>
