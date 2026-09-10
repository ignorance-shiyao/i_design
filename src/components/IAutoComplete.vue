<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  filterSuggestions,
  matchParts,
  moveActive,
  resolveOverlay,
  type Suggestion
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    options: Suggestion[]
    placeholder?: string
    /** 最多列出几条。列太多不如让用户再敲一个字 */
    limit?: number
    disabled?: boolean
  }>(),
  { modelValue: '', options: () => [], placeholder: '', limit: 8, disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [string]; select: [Suggestion] }>()

const open = ref(false)
const active = ref(-1)
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const position = ref({ x: 0, y: 0, placement: 'bottom' as string })

const matches = computed(() => filterSuggestions(props.options, props.modelValue, props.limit))
const labelOf = (item: Suggestion) => item.label ?? item.value

async function place() {
  const trigger = root.value?.getBoundingClientRect()
  await nextTick()
  const box = panel.value
  if (!trigger || !box) return
  const resolved = resolveOverlay({
    trigger: { x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height },
    // 量 offsetWidth 而不是 getBoundingClientRect：入场动画里有 scale，
    // 用带变换的尺寸算出来的位置会偏几个像素
    popup: { x: 0, y: 0, width: box.offsetWidth, height: box.offsetHeight },
    viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
    placement: 'bottom',
    align: 'start',
    offset: 4
  })
  position.value = { x: resolved.x, y: resolved.y, placement: resolved.placement }
}

async function show() {
  if (props.disabled) return
  open.value = true
  await place()
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
  // 每次改动都把高亮清掉：留着上一次的高亮，回车会选中一个与当前输入无关的项
  active.value = -1
  show()
}

function choose(item: Suggestion) {
  if (item.disabled) return
  emit('update:modelValue', item.value)
  emit('select', item)
  open.value = false
  active.value = -1
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
    return
  }
  if (!open.value && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    show()
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = moveActive(
      matches.value.map((m) => ({ value: m.value, disabled: m.disabled })),
      active.value,
      event.key === 'ArrowDown' ? 1 : -1
    )
    return
  }
  /*
   * 只有真的高亮了某一条，回车才算「选中候选」；没高亮时回车应当照常提交表单。
   * 反过来做的话，用户敲完一串自定义内容按回车，会被静默替换成第一条候选。
   */
  if (event.key === 'Enter' && open.value && active.value >= 0) {
    event.preventDefault()
    choose(matches.value[active.value])
  }
}
</script>

<template>
  <div ref="root" class="i-autocomplete">
    <!--
      combobox 三件套缺一不可：读屏靠 aria-expanded 知道下面展开了列表，
      靠 aria-activedescendant 知道当前高亮的是哪一条。少了它们，
      键盘上下移动对读屏用户完全是静默的。
    -->
    <input
      class="i-input i-autocomplete__input"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-activedescendant="active >= 0 ? `i-ac-${active}` : undefined"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
      @focus="show"
      @blur="open = false"
      @keydown="onKeydown"
    />

    <Teleport to="body">
      <ul
        v-if="open && matches.length"
        ref="panel"
        class="i-autocomplete__panel"
        role="listbox"
        :style="{ left: `${position.x}px`, top: `${position.y}px`, minWidth: `${root?.offsetWidth ?? 0}px` }"
      >
        <li
          v-for="(item, i) in matches"
          :id="`i-ac-${i}`"
          :key="item.value"
          class="i-autocomplete__option"
          :class="{ 'is-active': i === active, 'is-disabled': item.disabled }"
          role="option"
          :aria-selected="i === active"
          @mousedown.prevent="choose(item)"
          @mouseenter="active = i"
        >
          <!-- 命中段落由公共层切好：各端自己拼 HTML 既会错位也要处理转义 -->
          <span v-for="(part, p) in matchParts(labelOf(item), modelValue)" :key="p" :class="{ 'is-hit': part.hit }">
            {{ part.text }}
          </span>
        </li>
      </ul>
    </Teleport>
  </div>
</template>
