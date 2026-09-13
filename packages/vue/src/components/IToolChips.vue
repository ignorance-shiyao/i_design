<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IToolChips.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 工具芯片：把一串工具调用压成一行行芯片。
 *
 * 与 ChatToolCall 的分工：**芯片是折叠态，卡片是展开态**。
 * 智能体一次回答里可能调十几次工具，每次都摊成一张卡片，读者要滚三屏才看得到
 * 结论；全藏起来又没人知道它动了什么。所以默认给芯片——一行里只留
 * 「做了什么」与「动了多少」，点开某一片才换成完整的卡片。
 */
import { computed } from 'vue'
import { useConfig } from './useConfig'
import IIcon from './IIcon.vue'
import ILoading from './ILoading.vue'
import { summarizeToolChips, toolChipIcon, toolChipStat, type ToolChipItem } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    items: ToolChipItem[]
    /** 超过这个数量就折叠，留一个「还有 N 个」的按钮；0 表示不折叠 */
    max?: number
    /** 已展开（用 v-model:expanded 控制） */
    expanded?: boolean
  }>(),
  { max: 0, expanded: false }
)

const emit = defineEmits<{ (e: 'update:expanded', value: boolean): void; (e: 'select', item: ToolChipItem): void }>()

const { locale } = useConfig()

const clipped = computed(() => props.max > 0 && props.items.length > props.max && !props.expanded)
const shown = computed(() => (clipped.value ? props.items.slice(0, props.max) : props.items))
const rest = computed(() => props.items.length - shown.value.length)

/* 折叠时把被藏起来那部分的统计顶在按钮上：折叠不该等于把信息删掉 */
const hidden = computed(() => summarizeToolChips(props.items.slice(shown.value.length)))
const hiddenStat = computed(() => toolChipStat(hidden.value.added, hidden.value.removed))
</script>

<template>
  <div class="i-chips">
    <button
      v-for="item in shown"
      :key="item.key"
      class="i-chips__item"
      :class="`i-chips__item--${item.status ?? 'success'}`"
      type="button"
      @click="emit('select', item)"
    >
      <span class="i-chips__icon">
        <ILoading v-if="item.status === 'running'" size="sm" />
        <IIcon v-else :name="toolChipIcon(item.status)" :size="13" />
      </span>
      <span class="i-chips__label">{{ item.label }}</span>
      <!--
        统计用文字而不是只用颜色：色觉障碍用户与灰度打印都读不出「绿的是加、
        红的是删」，而「+13 −4」谁都读得出来。
      -->
      <span v-if="toolChipStat(item.added, item.removed)" class="i-chips__stat">
        <span v-if="item.added" class="i-chips__stat-add">+{{ item.added }}</span>
        <span v-if="item.removed" class="i-chips__stat-remove">−{{ item.removed }}</span>
      </span>
    </button>

    <button
      v-if="clipped"
      class="i-chips__more"
      type="button"
      @click="emit('update:expanded', true)"
    >
      <span>{{ locale.toolMoreText(rest) }}</span>
      <span v-if="hiddenStat" class="i-chips__stat">{{ hiddenStat }}</span>
      <span v-if="hidden.failed" class="i-chips__more-failed">{{ locale.toolFailedText(hidden.failed) }}</span>
    </button>
  </div>
</template>
