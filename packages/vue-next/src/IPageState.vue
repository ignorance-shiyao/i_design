<script setup lang="ts">
/**
 * 一块内容区的七种样子：加载中、空、无权限、失败、离线、部分成功、数据过期。
 *
 * 为什么要有这个组件：这七种在每个页面里都会被重写一遍，
 * 而写到第三个页面时，「部分成功」就开始被当成「失败」处理——
 * 已经成功的那批数据被一并清空，用户得从头再来一次。
 *
 * 判定在 @i-design/common 的 pageState 里，各端共用；这里只负责渲染。
 */
import { computed } from 'vue'
import { pageState, PAGE_STATE_ACTIONS, type PageStateInput } from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import IEmpty from './IEmpty.vue'
import ISkeleton from './ISkeleton.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    online?: boolean
    /** 请求错误；403 会被识别成「无权限」而不是普通失败 */
    error?: { code?: number | string; message?: string } | null
    /** 已经拿到的数据条数。部分成功要靠它与 failed 一起判定 */
    loaded?: number
    failed?: number
    fetchedAt?: number
    staleAfter?: number
    /** 空态的成因，决定用哪张插画与默认文案 */
    emptyType?: 'empty' | 'search' | 'error' | 'permission'
    title?: string
  }>(),
  {
    loading: false, online: true, error: null, loaded: 0, failed: 0,
    fetchedAt: undefined, staleAfter: undefined, emptyType: 'empty', title: ''
  }
)

const emit = defineEmits<{ (event: 'action', kind: string): void }>()

const state = computed(() => pageState(props as PageStateInput))

/*
 * 状态用「图标 + 淡底色块 + 文字标签」表达，不用加粗边线，也不靠颜色单独表意：
 * 色觉障碍用户与灰度打印都要读得出这是哪一种。
 */
const ICONS: Record<string, IconName> = {
  offline: 'offline',
  forbidden: 'lock',
  failed: 'error-circle',
  partial: 'warning-triangle',
  stale: 'history'
}

const TONE: Record<string, string> = {
  offline: 'muted',
  forbidden: 'warning',
  failed: 'danger',
  partial: 'warning',
  stale: 'muted'
}

const LABELS: Record<string, string> = {
  offline: '离线',
  forbidden: '无权限',
  failed: '加载失败',
  partial: '部分成功',
  stale: '数据已过期'
}
</script>

<template>
  <div class="i-page-state">
    <!-- 骨架屏只在一条数据都没有时占位；已有数据时刷新不该先变成一片白 -->
    <ISkeleton v-if="state.kind === 'loading' && !state.keepsContent" :rows="4" />

    <IEmpty v-else-if="state.kind === 'empty'" :type="emptyType" :title="title">
      <slot name="empty-action" />
    </IEmpty>

    <div v-else-if="state.kind !== 'ready'" class="i-page-state__note" :class="`is-${TONE[state.kind]}`" role="status">
      <span class="i-page-state__icon"><IIcon :name="ICONS[state.kind]" :size="18" /></span>
      <div class="i-page-state__body">
        <p class="i-page-state__title">{{ title || LABELS[state.kind] }}</p>
        <p class="i-page-state__reason">{{ state.reason }}</p>
      </div>
      <IButton
        v-if="state.action"
        variant="secondary"
        size="sm"
        @click="emit('action', state.action)"
      >
        {{ PAGE_STATE_ACTIONS[state.action] }}
      </IButton>
    </div>

    <!-- 内容始终由调用方给；这个组件只决定它现在该不该出现 -->
    <div v-if="state.keepsContent" class="i-page-state__content" :aria-busy="state.kind === 'loading'">
      <slot />
    </div>
  </div>
</template>
