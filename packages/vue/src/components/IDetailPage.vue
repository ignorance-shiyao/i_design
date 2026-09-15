<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IDetailPage.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 一条记录摊开之后的页面骨架（astra.md 的 B12）。
 *
 * 它不管字段怎么排——字段组、关联列表、时间轴都由调用方填进插槽。
 * 它管的是四件事，每一件都在 logic/detail.ts 里判：这条记录现在能做什么、
 * 看到的这一份还作不作数、从哪儿来回哪儿去、上一条 / 下一条。
 *
 * 版面顺序是刻意的：返回入口与「第几条」在最上面（用户是从列表点进来的，
 * 第一反应是「我在哪、怎么回去」），然后标题与状态，再是失效提示，最后才是动作。
 * 把动作放在失效提示上面的话，用户会先点、再读到「这份已经旧了」。
 */
import { computed } from 'vue'
import {
  detailActions,
  detailNeighbours,
  noActionHint,
  recordFreshness,
  returnLabel,
  unpackReturn,
  type DetailActionSpec
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import ITag from './ITag.vue'

const props = withDefaults(
  defineProps<{
    title: string
    /** 状态的显示名。同时也是「没有可执行操作」那句话里的那个词 */
    status: string
    statusTone?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
    summary?: string
    /** 这一页有哪些动作。状态不允许的不会出现，没权限的出现但停用 */
    actions?: DetailActionSpec[]
    /** 当前用户有哪些权限 */
    permissions?: string[]
    /** 进页面时拿到的版本号 */
    seenRevision?: number
    /** 此刻服务端上的版本号 */
    currentRevision?: number
    /** 记录还在吗 */
    exists?: boolean
    /** 业务规则挡下的动作：键是动作 key，值是给人看的原因 */
    denied?: Record<string, string>
    /** 列表里这一批的 id，用来算上一条 / 下一条 */
    siblingIds?: string[]
    currentId?: string
    /** 从列表带过来的返回票据（packReturn 的产物） */
    returnTicket?: string
  }>(),
  {
    statusTone: 'default',
    summary: '',
    actions: () => [],
    permissions: () => [],
    seenRevision: 0,
    currentRevision: 0,
    exists: true,
    denied: () => ({}),
    siblingIds: () => [],
    currentId: '',
    returnTicket: ''
  }
)

const emit = defineEmits<{ (e: 'action', key: string): void; (e: 'refresh'): void; (e: 'back', ticket: ReturnType<typeof unpackReturn>): void; (e: 'navigate', id: string): void }>()

const freshness = computed(() =>
  recordFreshness({
    seenRevision: props.seenRevision,
    currentRevision: props.currentRevision,
    exists: props.exists
  })
)

const actions = computed(() =>
  detailActions(props.actions, {
    status: props.status,
    permissions: props.permissions,
    freshness: freshness.value.kind,
    denied: props.denied
  })
)

/*
 * 灰按钮的理由按原因归并：同一个原因挡住三个动作时不说三遍。
 * 写在按钮下面而不是只挂 title——触摸屏没有悬停，读屏也不会主动去念 title。
 */
const reasons = computed(() => {
  const grouped = new Map<string, string[]>()
  for (const action of actions.value) {
    if (!action.disabled) continue
    grouped.set(action.reason, [...(grouped.get(action.reason) ?? []), action.label])
  }
  return [...grouped].map(([reason, labels]) => ({ reason, labels: labels.join('、') }))
})

const neighbours = computed(() => detailNeighbours(props.siblingIds, props.currentId))
const ticket = computed(() => unpackReturn(props.returnTicket))
const backText = computed(() => returnLabel(ticket.value))
</script>

<template>
  <article class="i-detail-page">
    <nav class="i-detail-page__nav" aria-label="记录导航">
      <IButton size="sm" variant="text" @click="emit('back', ticket)">
        <IIcon name="arrow-left" :size="14" />
        {{ backText }}
      </IButton>

      <p v-if="neighbours.position" class="i-detail-page__position">{{ neighbours.position }}</p>

      <div class="i-detail-page__steps">
        <!--
          到头了按钮停用而不是消失：消失会让人以为是页面坏了。
          停用的原因写在 aria-label 上，读屏才说得出「已经是第一条」。
        -->
        <IButton
          size="sm"
          :disabled="!neighbours.prevId"
          :aria-label="neighbours.prevId ? '上一条' : neighbours.edgeHint"
          @click="neighbours.prevId && emit('navigate', neighbours.prevId)"
        >
          上一条
        </IButton>
        <IButton
          size="sm"
          :disabled="!neighbours.nextId"
          :aria-label="neighbours.nextId ? '下一条' : neighbours.edgeHint"
          @click="neighbours.nextId && emit('navigate', neighbours.nextId)"
        >
          下一条
        </IButton>
      </div>
    </nav>

    <header class="i-detail-page__head">
      <h1 class="i-detail-page__title">{{ title }}</h1>
      <ITag :type="statusTone">{{ status }}</ITag>
      <slot name="extra" />
      <p v-if="summary" class="i-detail-page__summary">{{ summary }}</p>
    </header>

    <!-- 失效提示在动作上面：放下面的话，用户会先点、再读到「这份已经旧了」 -->
    <div
      v-if="freshness.kind !== 'fresh'"
      class="i-detail-page__stale"
      :class="{ 'i-detail-page__stale--deleted': freshness.kind === 'deleted' }"
      role="status"
    >
      <span class="i-detail-page__stale-icon">
        <IIcon :name="freshness.kind === 'deleted' ? 'error-circle' : 'history'" :size="14" />
      </span>
      <span class="i-detail-page__stale-label">{{ freshness.label }}</span>
      <span class="i-detail-page__stale-text">{{ freshness.detail }}</span>
      <IButton v-if="freshness.action === 'refresh'" size="sm" @click="emit('refresh')">
        刷新看最新
      </IButton>
      <IButton v-else-if="freshness.action === 'back'" size="sm" @click="emit('back', ticket)">
        回到列表
      </IButton>
    </div>

    <div v-if="actions.length" class="i-detail-page__actions">
      <IButton
        v-for="action in actions"
        :key="action.key"
        size="sm"
        :variant="action.kind === 'primary' ? 'primary' : action.kind === 'danger' ? 'danger' : 'secondary'"
        :disabled="action.disabled"
        :title="action.reason || undefined"
        @click="emit('action', action.key)"
      >
        {{ action.label }}
      </IButton>
    </div>
    <!-- 空白一片会让人以为页面没加载完 -->
    <p v-else class="i-detail-page__empty">{{ noActionHint(status) }}</p>

    <ul v-if="reasons.length" class="i-detail-page__reasons">
      <li v-for="item in reasons" :key="item.reason">
        <span class="i-detail-page__reason-keys">{{ item.labels }}</span>
        不可用：{{ item.reason }}
      </li>
    </ul>

    <div class="i-detail-page__body"><slot /></div>
  </article>
</template>
