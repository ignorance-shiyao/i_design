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
  dedentCode,
  diffLines as buildDiff,
  diffStat,
  tokenizeLines, shouldHighlight, plainLines,
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
    /** 还在流式输出中：染色阈值收紧，因为每来一片都要重算一次 */
    streaming?: boolean
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
    streaming: false,
    before: '',
    maxLines: 0
  }
)

const emit = defineEmits<{ copy: [] }>()

const { locale } = useConfig()

/* 首尾空行去掉：模板字符串写出来的代码几乎总是带着它们，留着白占两行 */
/*
 * 归一缩进：文档页的示例都写在模板内部，本身带着页面那几层缩进，
 * 原样渲染出来读者照着抄下来还得先手工对齐一遍。
 */
const source = computed(() => dedentCode(props.code))

const isDiff = computed(() => props.before !== '')
const diff = computed<DiffLine[]>(() =>
  isDiff.value ? buildDiff(props.before.replace(/^\n+|\s+$/g, ''), source.value) : []
)
const stat = computed(() => diffStat(diff.value))

/*
 * 普通视图：每行一串 token。
 *
 * 超过阈值就不染色了——染色是同步的，五千行 TS 实测 177ms，
 * 而流式输出时每来一片都会把整块重染一遍，用户会发现自己的输入框卡住了。
 * 没有颜色的代码仍然能读，卡住的输入框没法用。
 */
const highlighted = computed(() => shouldHighlight(source.value, props.streaming))
const lines = computed<CodeToken[][]>(() =>
  highlighted.value ? tokenizeLines(source.value, props.lang) : plainLines(source.value)
)

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
    <!--
      从这里到 </pre> 之间不能有任何多余空白：pre 会把模板里的换行与缩进
      原样渲染出来。此前每个 </span> 都另起一行，于是每一行代码后面都跟着
      一个换行加八个空格——在页面上表现为行距凭空翻倍、代码块上下各空出一截。
    -->
    <pre class="i-code__body" tabindex="0" :style="clipped ? { maxHeight: `calc(${maxLines} * 1.7em)` } : undefined"><code><template v-if="isDiff"><span
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
        >{{ token.text }}</span></span></template><template v-else><span v-for="(line, index) in lines" :key="index" class="i-code__line"><span
          v-if="lineNumbers"
          class="i-code__no"
        >{{ index + 1 }}</span><span
          v-for="(token, ti) in line"
          :key="ti"
          :class="`i-code__tok i-code__tok--${token.type}`"
        >{{ token.text }}</span></span></template></code></pre>
  </div>
</template>
