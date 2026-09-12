<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ICodeBlock.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 代码块。
 *
 * 三件事：高亮、行号、以及「这次改了什么」的统一 diff 视图。
 *
 * 不用 `v-html` 拼高亮结果，而是按 token 渲染节点。这个库是给 AI 交互场景用的，
 * 代码块里的内容常常来自模型与工具的输出——那是不可信内容，
 * 拼 HTML 字符串就等于给它开了一条注入路径。按 token 渲染让这条路径根本不存在。
 */
import { computed, ref } from 'vue'
import { useConfig } from './useConfig'
import IIcon from './IIcon.vue'
import {
  diffLines as buildDiff,
  diffStat,
  tokenizeLines,
  type CodeToken,
  type DiffLine
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    code: string
    /** 语言；不传则按内容猜，猜不出就不高亮 */
    lang?: string
    /** 标题栏左侧的文件名；不传则显示语言名 */
    filename?: string
    /** 显示行号 */
    lineNumbers?: boolean
    /** 显示复制按钮 */
    copyable?: boolean
    /**
     * 改动前的内容。给了就切成统一 diff 视图：
     * `code` 是改动后的样子，这里是改动前的。
     */
    before?: string
    /** 超过多少行折叠起来；0 表示不折叠 */
    maxLines?: number
  }>(),
  {
    lang: '',
    filename: '',
    lineNumbers: true,
    copyable: true,
    before: '',
    maxLines: 0
  }
)

const emit = defineEmits<{ (e: 'copy'): void }>()

const { locale } = useConfig()

/* 首尾空行去掉：模板字符串写出来的代码几乎总是带着它们，留着白占两行 */
const source = computed(() => props.code.replace(/^\n+|\s+$/g, ''))

const isDiff = computed(() => props.before !== '')
const diff = computed<DiffLine[]>(() =>
  isDiff.value ? buildDiff(props.before.replace(/^\n+|\s+$/g, ''), source.value) : []
)
const stat = computed(() => diffStat(diff.value))

/** 普通视图：每行一串 token */
const lines = computed<CodeToken[][]>(() => tokenizeLines(source.value, props.lang))

/** diff 视图：每行的 token 单独切，否则跨行的字符串会把后面几行一起染色 */
const diffTokens = computed(() => diff.value.map((line) => tokenizeLines(line.text, props.lang)[0] ?? []))

const total = computed(() => (isDiff.value ? diff.value.length : lines.value.length))
const clipped = computed(() => props.maxLines > 0 && total.value > props.maxLines)

/* 复制反馈是组件内部状态，不做成 v-model：调用方没有理由去控制「刚刚复制过」 */
const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(source.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
    emit('copy')
  } catch {
    // 剪贴板不可用（非 HTTPS 或未授权）时静默失败：代码本身仍可手动选中复制
  }
}

const label = computed(() => props.filename || props.lang || 'text')
</script>

<template>
  <div class="i-code" :class="{ 'is-diff': isDiff, 'is-clipped': clipped }">
    <div class="i-code__bar">
      <span class="i-code__name">{{ label }}</span>
      <!--
        改动统计用文字而不是只用颜色：色觉障碍用户与灰度打印都读不出
        「绿的是加、红的是删」，而「+13 −4」谁都读得出来。
      -->
      <span v-if="isDiff" class="i-code__stat">
        <span class="i-code__stat-add">+{{ stat.added }}</span>
        <span class="i-code__stat-remove">−{{ stat.removed }}</span>
      </span>
      <button v-if="copyable" class="i-code__copy" type="button" @click="copy">
        <IIcon :name="copied ? 'check' : 'copy'" :size="13" />
        {{ copied ? locale.copied : locale.copy }}
      </button>
    </div>

    <!-- 代码区会横向/纵向滚动：不给 tabindex，只用键盘的人进不去也滚不动 -->
    <pre class="i-code__body" tabindex="0" :style="clipped ? { maxHeight: `calc(${maxLines} * 1.7em)` } : undefined"><code>
      <template v-if="isDiff">
        <span
          v-for="(line, index) in diff"
          :key="index"
          class="i-code__line"
          :class="`i-code__line--${line.kind}`"
        ><span v-if="lineNumbers" class="i-code__no">{{ line.before ?? '' }}</span><span
          v-if="lineNumbers"
          class="i-code__no"
        >{{ line.after ?? '' }}</span><span class="i-code__sign" aria-hidden="true">{{
          line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '
        }}</span><span
          v-for="(token, ti) in diffTokens[index]"
          :key="ti"
          :class="`i-code__tok i-code__tok--${token.type}`"
        >{{ token.text }}</span>
        </span>
      </template>
      <template v-else>
        <span v-for="(line, index) in lines" :key="index" class="i-code__line"><span
          v-if="lineNumbers"
          class="i-code__no"
        >{{ index + 1 }}</span><span
          v-for="(token, ti) in line"
          :key="ti"
          :class="`i-code__tok i-code__tok--${token.type}`"
        >{{ token.text }}</span>
        </span>
      </template>
    </code></pre>
  </div>
</template>
