<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartWordCloud.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { useConfig } from './useConfig'
import { computed, onMounted, ref, watch } from 'vue'
import { wordLayout, wordOverflow, wordTone, WORD_MAX_SIZE, type WordItem } from '@i-design/common'

/* 文案走字典：图表的数据表是它的无障碍出口，按钮与表头也得跟着换语言 */
const { locale } = useConfig()

const props = withDefaults(
  defineProps<{
    words: WordItem[]
    title?: string
    width?: number
    height?: number
    rotate?: boolean
  }>(),
  { title: '', width: 640, height: 320, rotate: true }
)

const measured = ref<(WordItem & { width: number; height: number })[]>([])
const showTable = ref(false)
const active = ref(-1)

/*
 * 用 canvas 量字，而不是按「字数 × 字号」估。
 * 估出来的宽度对中文尚可，对拉丁字母能差出一倍——
 * 词云的避让全靠这个宽度，估错的直接后果是词叠在一起。
 * 量不到 canvas（SSR、老环境）时退回估算：图会糙一点，但不会整块空掉。
 */
function measure() {
  let ctx: CanvasRenderingContext2D | null = null
  if (typeof document !== 'undefined') {
    ctx = document.createElement('canvas').getContext('2d')
    if (ctx) {
      /*
       * 字体要取计算值，不能把 `var(--i-font-family)` 直接塞进 ctx.font——
       * canvas 不解析 CSS 变量，赋一个非法字体串它既不报错也不生效，
       * 只是静静地保留默认的 10px sans-serif。量出来的宽度于是小了四五倍，
       * 后果是所有词叠在一起：这在构建、类型检查里都看不出来。
       */
      const family = getComputedStyle(document.body).fontFamily || 'sans-serif'
      ctx.font = `${WORD_MAX_SIZE}px ${family}`
    }
  }

  /*
   * 高度取字体的实际行盒，不能直接拿字号当高度。
   * 48px 的字排出来是 54px 高——字号是 em 方框，而字形连同升部降部要比它高一成多。
   * 拿字号当高度，上下相邻的两个词就会啃掉那一成，压在一起。
   * 这一步同样不会报错，只会让图糊掉。
   */
  const lineHeight = (() => {
    if (!ctx) return WORD_MAX_SIZE * 1.2
    const m = ctx.measureText('设计Ag')
    const ink = (m.fontBoundingBoxAscent ?? 0) + (m.fontBoundingBoxDescent ?? 0)
    return ink > 0 ? ink : WORD_MAX_SIZE * 1.2
  })()

  measured.value = props.words.map((w) => ({
    ...w,
    width: ctx
      ? ctx.measureText(w.text).width
      : // 退路：中日韩字符按一个全角宽，其余按半角
        [...w.text].reduce((sum, c) => sum + (/[　-鿿＀-￯]/.test(c) ? 1 : 0.55), 0) *
        WORD_MAX_SIZE,
    height: lineHeight
  }))
}

onMounted(measure)
watch(() => props.words, measure, { deep: true })

const placed = computed(() =>
  wordLayout(measured.value, props.width, props.height, { rotate: props.rotate })
)
const dropped = computed(() => wordOverflow(props.words, placed.value))
</script>

<template>
  <figure class="i-chart i-wordcloud">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <svg
      class="i-chart__svg"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="title || '词云'"
      @mouseleave="active = -1"
    >
      <text
        v-for="(word, i) in placed"
        :key="word.text"
        class="i-wordcloud__word"
        :class="[`is-${wordTone(word.slot, placed.length)}`, { 'is-active': active === i }]"
        :x="word.x"
        :y="word.y"
        :font-size="word.fontSize"
        text-anchor="middle"
        dominant-baseline="central"
        :transform="word.rotated ? `rotate(-90 ${word.x} ${word.y})` : undefined"
        @mouseenter="active = i"
      >
        {{ word.text }}
        <title>{{ word.text }}：{{ word.value }}</title>
      </text>
    </svg>

    <!--
      放不下的词要说出来。读者看到词少了，得知道是「数据里就这些」
      还是「画布太小放不下」——这两者的结论完全不同。
    -->
    <p v-if="dropped" class="i-wordcloud__note">
      画布放不下 {{ dropped }} 个权重较低的词，可调大尺寸或在数据表里查看全部
    </p>

    <!--
      词云的字号差别本身就不精确，读者要拿到确切数值只能靠表。
      因此这张表不是无障碍的补丁，它是这个图的正式读法之一。
    -->
    <button class="i-chart__table-toggle" @click="showTable = !showTable">
      {{ showTable ? locale.chartTableHide : locale.chartTableShow }}
    </button>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr><th>词</th><th>权重</th></tr>
      </thead>
      <tbody>
        <tr v-for="word in [...words].sort((a, b) => b.value - a.value)" :key="word.text">
          <td>{{ word.text }}</td>
          <td>{{ word.value }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
