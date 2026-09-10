<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IMentions.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { applyMention, filterMentions, findMention, moveMenuActive } from '@i-design/common'

export interface MentionOption {
  value: string
  label: string
  /** 额外的搜索词，比如拼音或英文名 */
  keywords?: string[]
  desc?: string
  /** 不可选的候选（比如没有权限的成员）仍然列出来，但跳过 */
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    value?: string
    options: MentionOption[]
    /** 触发符，可以多个：@ 提人、/ 唤起命令 */
    symbols?: string[]
    placeholder?: string
    rows?: number
  }>(),
  { value: '', symbols: () => ['@'], placeholder: '', rows: 3 }
)

const emit = defineEmits<{ (e: 'input', a0: string): void; (e: 'select', a0: MentionOption): void }>()

const input = ref<HTMLTextAreaElement | null>(null)
const trigger = ref<ReturnType<typeof findMention>>(null)
const active = ref(0)

const matches = computed(() =>
  trigger.value ? filterMentions(props.options, trigger.value.query) : []
)
const open = computed(() => !!trigger.value && matches.value.length > 0)

function sync() {
  const el = input.value
  if (!el) return
  trigger.value = findMention(el.value, el.selectionStart ?? 0, props.symbols)
  active.value = 0
}

function onInput(event: Event) {
  emit('input', (event.target as HTMLTextAreaElement).value)
  sync()
}

async function choose(option: MentionOption) {
  const el = input.value
  if (!el || !trigger.value) return
  const next = applyMention(el.value, trigger.value, option.label, el.selectionStart ?? 0)
  emit('input', next.text)
  emit('select', option)
  trigger.value = null
  await nextTick()
  // 光标要落回插入点之后，否则用户接着打字会打在句首
  el.setSelectionRange(next.caret, next.caret)
  el.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    // 候选没有禁用项，但仍走同一个循环规则：到底回到头，与菜单、下拉一致
    active.value = moveMenuActive(matches.value, active.value, event.key === 'ArrowDown' ? 1 : -1)
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    // 候选开着时回车是「选中」，不是换行——这也是必须在打完空格后收起候选的原因
    event.preventDefault()
    choose(matches.value[active.value])
  } else if (event.key === 'Escape') {
    trigger.value = null
  }
}
</script>

<template>
  <div class="i-mentions">
    <textarea
      ref="input"
      class="i-mentions__input"
      :value="value"
      :placeholder="placeholder"
      :rows="rows"
      :aria-expanded="String(open)"
      aria-autocomplete="list"
      @input="onInput"
      @click="sync"
      @keyup="sync"
      @keydown="onKeydown"
      @blur="trigger = null"
    />

    <!--
      候选面板贴在输入框下方，而不是跟着光标走。
      跟随光标要量出插入点的像素位置——textarea 没有这个 API，
      得靠一个隐藏的镜像元素反推，而中文输入法的组合态会让镜像与实际错位。
      贴在框下不会更差：候选列表本来就该看全，而不是挤在一行字里。
    -->
    <ul v-if="open" class="i-mentions__list" role="listbox">
      <li
        v-for="(option, index) in matches"
        :key="option.value"
        class="i-mentions__option"
        :class="{ 'is-active': index === active }"
        role="option"
        :aria-selected="String(index === active)"
        @mousedown.prevent="choose(option)"
        @mouseenter="active = index"
      >
        <span class="i-mentions__label">{{ option.label }}</span>
        <span v-if="option.desc" class="i-mentions__desc">{{ option.desc }}</span>
      </li>
    </ul>
  </div>
</template>
