<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITagInput.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'
import {
  DEFAULT_SEPARATORS,
  addTags,
  backspace,
  removeTag,
  splitDraft,
  splitTags
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    value?: string[]
    placeholder?: string
    /** 允许重复。默认不允许——重复的标签在任何筛选场景里都是噪声 */
    allowDuplicate?: boolean
    /** 最多几个 */
    max?: number
    disabled?: boolean
    /** 除回车外，哪些字符也触发成词 */
    separators?: string[]
  }>(),
  {
    value: () => [],
    placeholder: '输入后回车',
    allowDuplicate: false,
    max: 0,
    disabled: false,
    separators: () => DEFAULT_SEPARATORS
  }
)

const emit = defineEmits<{ (e: 'input', a0: string[]): void; (e: 'reject', a0: string): void }>()

const draft = ref('')
const input = ref<HTMLInputElement | null>(null)
const focused = ref(false)

const options = computed(() => ({
  allowDuplicate: props.allowDuplicate,
  max: props.max,
  separators: props.separators
}))

const full = computed(() => props.max > 0 && props.value.length >= props.max)

/** 拒绝的理由要说出来：不给理由的话，用户会以为组件坏了 */
const REASON = {
  duplicate: '已经有相同的标签了',
  max: `最多只能添加 ${props.max} 个`,
  empty: '空白不能作为标签'
}

function commit(parts: string[]) {
  if (!parts.length) return
  const result = addTags(props.value, parts, options.value)
  if (result.tags.length !== props.value.length) emit('input', result.tags)
  if (result.rejected) emit('reject', REASON[result.rejected])
}

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  /*
   * 输入中途遇到分隔符就成词，但最后一段留在输入框里：
   * 粘贴 "a,b,c" 时 c 还该能继续编辑，连它一起变成标签的话，
   * 用户要补字就得先把标签删掉。
   */
  const { ready, rest } = splitDraft(value, props.separators)
  draft.value = rest
  commit(ready)
}

function onEnter() {
  commit(splitTags(draft.value, props.separators))
  draft.value = ''
}

function onBackspace(event: KeyboardEvent) {
  // 只有输入框为空时才删末项：有内容时删字符是所有输入框的通用行为
  const result = backspace(props.value, draft.value)
  if (!result.consumed) return
  event.preventDefault()
  emit('input', result.tags)
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!text) return
  event.preventDefault()
  commit(splitTags(text, props.separators))
}

function drop(index: number) {
  emit('input', removeTag(props.value, index))
}
</script>

<template>
  <!--
    整个框可点，焦点转给里面的 input：只有 input 可点的话，
    标签之间那几像素的空隙点下去毫无反应，用户会以为框是死的。
  -->
  <div
    class="i-taginput"
    :class="{ 'is-focused': focused, 'is-disabled': disabled, 'is-full': full }"
    @click="input?.focus()"
  >
    <span v-for="(tag, i) in value" :key="`${tag}-${i}`" class="i-taginput__tag">
      {{ tag }}
      <button
        v-if="!disabled"
        class="i-taginput__remove"
        :aria-label="`移除 ${tag}`"
        type="button"
        @click.stop="drop(i)"
      >
        <IIcon name="close" :size="11" />
      </button>
    </span>

    <input
      ref="input"
      class="i-taginput__input"
      :value="draft"
      :placeholder="value.length ? '' : placeholder"
      :disabled="disabled || full"
      :aria-label="placeholder"
      @input="onInput"
      @keydown.enter.prevent="onEnter"
      @keydown.backspace="onBackspace"
      @paste="onPaste"
      @focus="focused = true"
      @blur="focused = false; onEnter()"
    />

    <!-- 上限就摆在框里，而不是等超了再弹提示：先说清楚比事后纠正省事 -->
    <span v-if="max > 0" class="i-taginput__count">{{ value.length }} / {{ max }}</span>
  </div>
</template>
