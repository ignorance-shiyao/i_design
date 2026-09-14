<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IProTable.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * ProTable：带查询层与列能力的表格（astra.md 的 B04 + B05）。
 *
 * **组件不发请求。** 它把「现在该请求什么」作为事件抛出去，由页面去取数——
 * 组件内置请求的话，取消、重试、鉴权、缓存这些事就都得在组件里再实现一遍，
 * 而每个项目的做法都不一样。
 *
 * **过期响应的判定在公共层。** 页面把带序号的结果交回来，组件只负责渲染
 * 落地后的那一份；序号比屏幕上这份旧的会被丢掉（见 logic/protable.ts），
 * 否则乱序返回时用户看到的是一份对不上当前条件的数据，且没有任何报错。
 *
 * **隐藏列与权限是两件事。** 列设置只管显示；受权限控制的列由 restricted 标记，
 * 导出与接口按它校验——合并这两者的后果是「藏一列就等于跳过它的权限检查」。
 */
import { computed, ref, watch } from 'vue'
import IButton from './IButton.vue'
import ICheckbox from './ICheckbox.vue'
import IIcon from './IIcon.vue'
import IPagination from './IPagination.vue'
import ISegmented from './ISegmented.vue'
import {
  DENSITY_ROW_HEIGHT,
  defaultColumnState,
  fixColumn,
  pageCount,
  resetColumns,
  resolveTableColumns,
  setDensity,
  setPage,
  setPageSize,
  setSort,
  toggleColumn,
  type ColumnSpec,
  type ColumnState,
  type TableDensity,
  type TableQuery,
  type TableState
} from '@i-design/common'

type Row = Record<string, unknown>

const props = withDefaults(
  defineProps<{
    columns: ColumnSpec[]
    /** 查询层状态。由页面持有，组件只读它并抛出「该请求什么」 */
    state: TableState<Row>
    /** 列设置。不传则组件自己维护一份内部状态 */
    columnState?: ColumnState | null
    rowKey?: string
    /** 可视宽度，用来判断固定列是否已经占满。窄屏上这个值要小 */
    viewportWidth?: number
    emptyText?: string
  }>(),
  { columnState: null, rowKey: 'id', viewportWidth: 960, emptyText: '没有符合条件的数据' }
)

const emit = defineEmits<{ (e: 'request', query: TableQuery): void; (e: 'update:columnState', state: ColumnState): void }>()

const inner = ref<ColumnState>(defaultColumnState(props.columns))
const columnState = computed(() => props.columnState ?? inner.value)

function setColumnState(next: ColumnState) {
  inner.value = next
  emit('update:columnState', next)
}

const panel = ref(false)
/* 固定列被拒时的说明。不说的话，用户只会觉得「点了没反应」 */
const rejected = ref('')

const resolved = computed(() => resolveTableColumns(props.columns, columnState.value))
const shown = computed(() => resolved.value.filter((c) => !c.hidden))
const rowHeight = computed(() => DENSITY_ROW_HEIGHT[columnState.value.density])

const densities: { label: string; value: TableDensity }[] = [
  { label: '紧凑', value: 'compact' },
  { label: '默认', value: 'default' },
  { label: '宽松', value: 'loose' }
]

const totalPages = computed(() => pageCount(props.state.total, props.state.query.pageSize))

/* 排序、翻页、改页长都只做一件事：算出新的查询，然后请出去 */
function ask(next: TableState<Row>) {
  emit('request', next.query)
}

const onSort = (key: string) => ask(setSort(props.state, key))
const onPage = (page: number) => ask(setPage(props.state, page))
const onPageSize = (size: number) => ask(setPageSize(props.state, size))

function onToggleColumn(key: string) {
  setColumnState(toggleColumn(columnState.value, key, props.columns))
}

function onFix(key: string, fixed: 'left' | null) {
  const result = fixColumn(columnState.value, key, fixed, { viewportWidth: props.viewportWidth })
  rejected.value = result.rejected ?? ''
  if (!result.rejected) setColumnState(result.state)
}

/* 列设置改动后那条拒绝说明就过期了，留着会让人以为还在报同一件事 */
watch(columnState, () => (rejected.value = ''), { deep: true })

/* 未排序时用最淡的一档「更多」而不是上下箭头：箭头会被读成「已经排过了」 */
const sortIcon = (key: string) => {
  if (props.state.query.sort.key !== key) return 'more' as const
  return props.state.query.sort.order === 'asc' ? ('chevron-up' as const) : ('chevron-down' as const)
}

/** 固定列的左偏移：按它前面那些固定列的宽度累加 */
function fixedOffset(index: number) {
  return shown.value
    .slice(0, index)
    .filter((c) => c.fixed === 'left')
    .reduce((sum, c) => sum + (Number.parseFloat(c.width ?? '') || 160), 0)
}
</script>

<template>
  <section class="i-pro-table">
    <div class="i-pro-table__bar">
      <span class="i-pro-table__count">
        共 {{ state.total }} 条
        <!-- 还有请求在路上时明说，而不是让用户对着一份旧数据以为是新的 -->
        <span v-if="state.status === 'loading'" class="i-pro-table__stale">（正在更新…）</span>
      </span>

      <div class="i-pro-table__tools">
        <ISegmented
          :value="columnState.density"
          :options="densities"
          @input="(v) => setColumnState(setDensity(columnState, v))"
        />
        <IButton size="sm" :aria-expanded="String(panel)" @click="panel = !panel">
          <IIcon name="layers" :size="14" /> 列设置
        </IButton>
      </div>
    </div>

    <!-- 列设置面板：显隐、固定、恢复默认。恢复默认这个出口必须一直在 -->
    <div v-if="panel" class="i-pro-table__panel">
      <div v-for="column in resolved" :key="column.key" class="i-pro-table__panel-row">
        <ICheckbox
          :value="!column.hidden"
          :disabled="column.locked"
          @input="() => onToggleColumn(column.key)"
        >
          {{ column.title }}
          <span v-if="column.locked" class="i-pro-table__hint">（主键不可隐藏）</span>
          <span v-else-if="column.restricted" class="i-pro-table__hint">（受权限控制）</span>
        </ICheckbox>
        <button
          type="button"
          class="i-pro-table__fix"
          :aria-pressed="String(column.fixed === 'left')"
          @click="onFix(column.key, column.fixed === 'left' ? null : 'left')"
        >
          {{ column.fixed === 'left' ? '取消固定' : '固定在左' }}
        </button>
      </div>
      <p v-if="rejected" class="i-pro-table__rejected" role="status">{{ rejected }}</p>
      <IButton size="sm" @click="setColumnState(resetColumns(columns))">恢复默认</IButton>
    </div>

    <div class="i-pro-table__scroll">
      <table class="i-pro-table__table" :style="{ '--i-pro-row-height': `${rowHeight}px` }">
        <thead>
          <tr>
            <th
              v-for="(column, index) in shown"
              :key="column.key"
              :class="{ 'is-fixed': column.fixed === 'left' }"
              :style="column.fixed === 'left' ? { left: `${fixedOffset(index)}px`, width: column.width } : { width: column.width }"
              :aria-sort="state.query.sort.key === column.key
                ? (state.query.sort.order === 'asc' ? 'ascending' : 'descending')
                : 'none'"
            >
              <button v-if="column.sortable" type="button" class="i-pro-table__sort" @click="onSort(column.key)">
                {{ column.title }}
                <IIcon :name="sortIcon(column.key)" :size="12" />
              </button>
              <template v-else>{{ column.title }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in state.rows" :key="String(row[rowKey] ?? rowIndex)">
            <td
              v-for="(column, index) in shown"
              :key="column.key"
              :class="{ 'is-fixed': column.fixed === 'left' }"
              :style="column.fixed === 'left' ? { left: `${fixedOffset(index)}px` } : undefined"
            >
              <slot :name="column.key" :row="row" :value="row[column.key]">{{ row[column.key] }}</slot>
            </td>
          </tr>
          <tr v-if="!state.rows.length">
            <td :colspan="shown.length" class="i-pro-table__empty">
              {{ state.status === 'error' ? state.error : emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="i-pro-table__foot">
      <IPagination
        :total="state.total"
        :value="state.query.page"
        :page-size="state.query.pageSize"
        @input="onPage"
      />
      <label class="i-pro-table__size">
        每页
        <select
          :value="state.query.pageSize"
          @change="(e) => onPageSize(Number((e.target).value))"
        >
          <option v-for="size in [10, 20, 50, 100]" :key="size" :value="size">{{ size }}</option>
        </select>
        条，共 {{ totalPages }} 页
      </label>
    </div>
  </section>
</template>
