<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IRecommendCard.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { confidenceOf } from '@i-design/common'
import IButton from './IButton.vue'

const props = withDefaults(
  defineProps<{
    title: string
    /** 0–1 的置信度；分三档展示，不显示精确数字 */
    confidence?: number
    acceptText?: string
    alternativeText?: string
    /** 不给替代方案时隐藏那个按钮 */
    showAlternative?: boolean
  }>(),
  { confidence: 0.8, acceptText: '采纳', alternativeText: '换一个', showAlternative: true }
)

const emit = defineEmits<{ (e: 'accept'): void; (e: 'alternative'): void }>()
const level = computed(() => confidenceOf(props.confidence))
</script>

<template>
  <section class="i-agent-card i-recommend">
    <p class="i-recommend__title">{{ title }}</p>
    <div class="i-recommend__body"><slot /></div>

    <footer class="i-recommend__foot">
      <!--
        置信度用三格 + 文字。格子是视觉线索，文字才是主要表达——
        色觉障碍用户与灰度打印下，只剩文字可读。
      -->
      <span class="i-confidence" :class="`is-${level.level}`" :title="level.label">
        <span class="i-confidence__bars" aria-hidden="true">
          <span
            v-for="n in 3"
            :key="n"
            class="i-confidence__bar"
            :class="{ 'is-on': n <= level.bars }"
          />
        </span>
        {{ level.label }}
      </span>

      <div class="i-recommend__actions">
        <IButton v-if="showAlternative" size="sm" @click="emit('alternative')">
          {{ alternativeText }}
        </IButton>
        <IButton size="sm" variant="primary" @click="emit('accept')">{{ acceptText }}</IButton>
      </div>
    </footer>
  </section>
</template>
