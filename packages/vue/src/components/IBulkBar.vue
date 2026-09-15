<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IBulkBar.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 列表页上方的批量操作条（astra.md 的 B07）。
 *
 * 它的第一职责不是摆按钮，是把「对谁做」说清楚。列表页上「全选」这个词有
 * 三种含义：勾中的这几行、当前这一页、符合当前筛选的全部；三者在屏幕上差别
 * 极小而后果差着数量级，所以作用域在这里是一个显式的值，摘要永远写在按钮
 * 左边——读者的视线从左往右，把范围写在按钮右边等于让他先点后读。
 *
 * 第二职责是把部分失败摊开。批量操作十有八九是部分成功，结果不该弹成一个
 * 「确定」就消失的提示：失败的那几条还要照着去处理，重试也只能发这几条。
 *
 * 判断全在 logic/bulk.ts，五端共用一份。
 */
import { computed, ref, watch } from 'vue'
import {
  bulkSelection,
  canEscalate,
  escalateLabel,
  type BulkId,
  type BulkOutcome,
  type BulkScope
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'

const props = withDefaults(
  defineProps<{
    /** 当前作用域。受控：这是整条的核心状态，不能由组件自己猜 */
    scope?: BulkScope
    /** 当前页的行 id */
    pageIds?: BulkId[]
    /** 用户勾中的行 id */
    selectedIds?: BulkId[]
    /** 符合当前筛选的总条数，由服务端给 */
    matchedTotal?: number
    /** 当前有没有筛选条件。没有筛选时「全部匹配」就是「全表」 */
    filtered?: boolean
    /** 上一轮的执行结果。给了就把成功与失败摊在条下面 */
    outcome?: BulkOutcome
    /** 正在执行 */
    busy?: boolean
    /** 失败清单最多列几条，再多就折成一句 */
    maxFailures?: number
  }>(),
  {
    scope: 'selected',
    pageIds: () => [],
    selectedIds: () => [],
    matchedTotal: 0,
    filtered: false,
    outcome: undefined,
    busy: false,
    maxFailures: 5
  }
)

const emit = defineEmits<{ (e: 'update:scope', scope: BulkScope): void; (e: 'execute', selection: ReturnType<typeof bulkSelection>): void; (e: 'retry', ids: BulkId[]): void; (e: 'clear'): void }>()

const selection = computed(() =>
  bulkSelection({
    scope: props.scope,
    pageIds: props.pageIds,
    selectedIds: props.selectedIds,
    matchedTotal: props.matchedTotal,
    filtered: props.filtered
  })
)

const escalatable = computed(() =>
  props.scope !== 'matched' &&
  canEscalate({
    pageIds: props.pageIds,
    selectedIds: props.selectedIds,
    matchedTotal: props.matchedTotal
  })
)

const asking = ref(false)
// 范围一变，之前那次确认就不作数了——它复述的条数已经不对
watch(() => [props.scope, props.matchedTotal, props.selectedIds.length], () => { asking.value = false })

function run() {
  if (selection.value.needsConfirm && !asking.value) {
    asking.value = true
    return
  }
  asking.value = false
  emit('execute', selection.value)
}

const visibleFailures = computed(() => props.outcome?.failed.slice(0, props.maxFailures) ?? [])
const hiddenFailures = computed(() =>
  Math.max(0, (props.outcome?.failed.length ?? 0) - props.maxFailures)
)
</script>

<template>
  <div
    v-if="selection.count > 0 || outcome"
    class="i-bulk-bar"
    :class="{ 'i-bulk-bar--matched': scope === 'matched' }"
    role="region"
    aria-label="批量操作"
  >
    <span v-if="scope === 'matched'" class="i-bulk-bar__badge">
      <IIcon name="warning-triangle" :size="14" />
    </span>

    <!-- 摘要在最左边，在按钮之前：范围写在按钮右边等于让人先点后读 -->
    <p class="i-bulk-bar__summary">
      <span class="i-bulk-bar__count">{{ selection.summary }}</span>
    </p>

    <div class="i-bulk-bar__scope">
      <!-- 只在「当前页已全勾上、匹配总数更多」时给这个入口 -->
      <IButton v-if="escalatable" size="sm" variant="text" @click="emit('update:scope', 'matched')">
        {{ escalateLabel(matchedTotal, filtered) }}
      </IButton>
      <IButton
        v-if="scope === 'matched'"
        size="sm"
        variant="text"
        @click="emit('update:scope', 'selected')"
      >
        仅保留已勾选的 {{ selectedIds.length }} 项
      </IButton>
      <IButton v-if="selection.count > 0" size="sm" variant="text" @click="emit('clear')">
        取消选择
      </IButton>
    </div>

    <div class="i-bulk-bar__actions">
      <slot name="actions" :selection="selection" :run="run" />
      <IButton
        v-if="!$scopedSlots.actions"
        size="sm"
        variant="primary"
        :loading="busy"
        :disabled="busy || selection.count === 0"
        @click="run"
      >
        执行
      </IButton>
    </div>

    <!--
      确认就地展开在条下面：用户点的是这条上的按钮，答案就该出现在这条上。
      role="alertdialog" 让读屏知道这里在等一个答复。
    -->
    <div
      v-if="asking"
      class="i-bulk-bar__panel i-bulk-bar__panel--danger"
      role="alertdialog"
      :aria-label="selection.confirmMessage"
    >
      <span class="i-bulk-bar__panel-icon"><IIcon name="warning-triangle" :size="14" /></span>
      <span class="i-bulk-bar__panel-text">{{ selection.confirmMessage }}</span>
      <IButton size="sm" @click="asking = false">再看看</IButton>
      <IButton size="sm" variant="danger" @click="run">确认执行</IButton>
    </div>

    <template v-if="outcome">
      <div
        class="i-bulk-bar__panel"
        :class="
          outcome.kind === 'all-ok'
            ? 'i-bulk-bar__panel--success'
            : 'i-bulk-bar__panel--danger'
        "
        role="status"
      >
        <span class="i-bulk-bar__panel-icon">
          <IIcon :name="outcome.kind === 'all-ok' ? 'check-circle' : 'error-circle'" :size="14" />
        </span>
        <span class="i-bulk-bar__panel-text">{{ outcome.summary }}</span>
        <!-- 重试只发失败项：成功项再执行一次，扣款与发货这类动作就是事故 -->
        <IButton
          v-if="outcome.retryIds.length"
          size="sm"
          :loading="busy"
          @click="emit('retry', outcome.retryIds)"
        >
          只重试失败的 {{ outcome.retryIds.length }} 项
        </IButton>
      </div>

      <ul v-if="visibleFailures.length" class="i-bulk-bar__failures">
        <li v-for="item in visibleFailures" :key="String(item.id)">
          <span class="i-bulk-bar__failure-id">{{ item.id }}</span>
          —— {{ item.reason }}
        </li>
        <li v-if="hiddenFailures">还有 {{ hiddenFailures }} 项失败，展开列表查看</li>
      </ul>
    </template>
  </div>
</template>
