<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IEmpty.vue 转换而来。
  差异仅在 Vue 2 的语法约束（v-model 用 value/input、模板需单根），行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { emptyIllustrations } from '@i-design/common'

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

const presets: Record<string, { title: string; description: string }> = {
  empty: { title: '暂无数据', description: '这里还没有内容，创建第一条试试。' },
  search: { title: '没有匹配结果', description: '换个关键词，或减少筛选条件。' },
  error: { title: '加载失败', description: '请检查网络后重试。' },
  permission: { title: '无访问权限', description: '请联系管理员申请该资源的访问权限。' }
}
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
    <p class="i-empty__title">{{ title || presets[type].title }}</p>
    <p class="i-empty__desc">{{ description || presets[type].description }}</p>
    <div v-if="$slots.default" class="i-empty__action"><slot /></div>
  </div>
</template>
