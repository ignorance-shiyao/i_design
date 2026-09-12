<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IEmpty.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { emptyIllustrations } from '@i-design/common'
import { useConfig } from './useConfig'

const props = withDefaults(
  defineProps<{
    /** 空态成因决定文案与可用操作 */
    type?: 'empty' | 'search' | 'error' | 'permission'
    title?: string
    description?: string
    size?: 'sm' | 'md'
  }>(),
  { type: 'empty', title: '', description: '', size: 'md' }
)

const art = computed(() => emptyIllustrations[props.type])

/* 四种成因的默认文案跟着字典走，换语言时空态不会是唯一还在说中文的地方 */
const { locale } = useConfig()
const preset = computed(() => locale.value.emptyPresets[props.type])
</script>

<template>
  <div class="i-empty" :class="`i-empty--${size}`">
    <!-- illustration 插槽：业务可整体替换；默认使用体系自带的猫咪插画 -->
    <slot name="illustration">
      <img
        class="i-empty__art"
        :src="art.src"
        :srcset="art.srcset"
        :width="art.width"
        alt=""
        loading="lazy"
        decoding="async"
      />
    </slot>
    <p class="i-empty__title">{{ title || preset.title }}</p>
    <p class="i-empty__desc">{{ description || preset.description }}</p>
    <div v-if="$scopedSlots.default" class="i-empty__action"><slot /></div>
  </div>
</template>
