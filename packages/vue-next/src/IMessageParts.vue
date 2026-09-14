<script setup lang="ts">
/**
 * 一条消息的多段混排。
 *
 * 模型的一次回答不是一块纯文本：正文、推理、代码、工具调用、产物、引用
 * 会交替出现，而且每一段的收尾时间不同。把它们拼成一个字符串再渲染，
 * 会丢掉「这一段还没收完」这个信息——而那正是流式界面最需要表达的东西。
 *
 * 段的顺序就是到达顺序，由 reducer 维护；这一层只负责按类型选渲染方式。
 */
import { computed } from 'vue'
import type { MessagePart } from '@i-design/common'
import IMarkdown from './IMarkdown.vue'
import ICodeBlock from './ICodeBlock.vue'
import IIcon from './IIcon.vue'

const props = withDefaults(
  defineProps<{
    parts?: MessagePart[]
    /** 引用编号对应的来源标题，用于把角标写成人能读的东西 */
    sources?: { id: string; title: string }[]
    compact?: boolean
  }>(),
  { parts: () => [], sources: () => [], compact: false }
)

const emit = defineEmits<{
  /** 点了引用角标：把来源定位出来是调用方的事，组件只说点了哪一个 */
  cite: [sourceId: string]
}>()

const sourceTitle = (id: string) => props.sources.find((s) => s.id === id)?.title ?? id

/** 引用按出现顺序编号：读者看到的是 [1][2]，不是一串 uuid */
const citeIndex = computed(() => {
  const order = new Map<string, number>()
  for (const part of props.parts) {
    if (part.kind !== 'citation') continue
    const id = part.meta?.sourceId ?? part.text
    if (!order.has(id)) order.set(id, order.size + 1)
  }
  return order
})
</script>

<template>
  <div class="i-msg-parts" :class="{ 'is-compact': compact }">
    <template v-for="part in parts" :key="part.id">
      <!-- 正文：走 Markdown，原始 HTML 当纯文本、地址过白名单 -->
      <IMarkdown v-if="part.kind === 'text'" :source="part.text" :compact="compact" />

      <!-- 推理过程默认折叠：它是给愿意深究的人看的，不该挤掉结论 -->
      <details v-else-if="part.kind === 'reasoning'" class="i-msg-parts__reasoning">
        <summary>
          <IIcon name="sparkle" :size="14" />
          推理过程{{ part.complete ? '' : '（进行中）' }}
        </summary>
        <IMarkdown :source="part.text" compact />
      </details>

      <ICodeBlock
        v-else-if="part.kind === 'code'"
        :code="part.text"
        :lang="part.meta?.lang"
        :copyable="part.complete"
        :streaming="!part.complete"
      />

      <!-- 工具调用与产物只给一行摘要与入口，详情由上层组件展开 -->
      <div v-else-if="part.kind === 'tool'" class="i-msg-parts__chip">
        <span class="i-msg-parts__chip-icon"><IIcon name="code" :size="14" /></span>
        <span>{{ part.meta?.name ?? '工具调用' }}</span>
        <span class="i-msg-parts__chip-state">{{ part.complete ? '已完成' : '执行中' }}</span>
      </div>

      <div v-else-if="part.kind === 'artifact'" class="i-msg-parts__chip">
        <span class="i-msg-parts__chip-icon"><IIcon name="file-text" :size="14" /></span>
        <span>{{ part.meta?.title ?? '产物' }}</span>
        <span v-if="part.meta?.version" class="i-msg-parts__chip-state">v{{ part.meta.version }}</span>
      </div>

      <!--
        引用角标可点、可聚焦：引用的价值在于能回到出处，
        只显示一个上标数字而点不动，等于把出处藏起来了。
      -->
      <button
        v-else-if="part.kind === 'citation'"
        class="i-msg-parts__cite"
        type="button"
        :aria-label="`引用 ${citeIndex.get(part.meta?.sourceId ?? part.text)}：${sourceTitle(part.meta?.sourceId ?? part.text)}`"
        @click="emit('cite', part.meta?.sourceId ?? part.text)"
      >[{{ citeIndex.get(part.meta?.sourceId ?? part.text) }}]</button>
    </template>
  </div>
</template>
