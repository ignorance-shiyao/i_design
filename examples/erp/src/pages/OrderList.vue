<script setup lang="ts">
/**
 * 订单列表：查询筛选 + 表格 + 分页。
 *
 * 筛选条件走 IQueryFilter 与共用的查询状态机，条件一变回第一页；
 * 条件同时写进 hash 的 query 部分，刷新与「复制链接给同事」都能还原——
 * 这正是 B03 那份契约要证明的事。
 */
import { computed, ref, watch } from 'vue'
import { IBulkBar, IButton, IPagination, IQueryFilter, ITable, ITag } from '@i-design/vue-next'
import {
  bulkOutcome,
  fromSearch,
  mergeOutcome,
  packReturn,
  parseQuery,
  serializeQuery,
  toSearch,
  type BulkId,
  type BulkOutcome,
  type BulkScope,
  type FilterField,
  type QueryState,
  type QuickFilter
} from '@i-design/common'
import { ApiError } from '@i-design/examples-shared'
import { STATUS_LABEL, STATUS_TONE, api, money, personName, session, staff } from '../data'

/*
 * 打开详情时把「从哪儿来」一并交出去：查询串、滚动位置、点的是哪一行，
 * 外加这一页的 id 列表（详情页的上一条 / 下一条要用）。
 * 不交的话，详情页返回时只能落回第一页顶部——等于把用户翻的七页作废。
 */
const emit = defineEmits<{ open: [payload: { id: string; ticket: string; ids: string[] }] }>()

const fields: FilterField[] = [
  { name: 'keyword', label: '关键词', kind: 'text', placeholder: '单号或客户', always: true },
  {
    name: 'status',
    label: '状态',
    kind: 'select',
    always: true,
    options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))
  },
  {
    name: 'owner',
    label: '负责人',
    kind: 'multi-select',
    options: staff.slice(0, 5).map((p) => ({ value: p.id, label: p.name }))
  }
]

const quickFilters: QuickFilter[] = [
  { key: 'approving', label: '待我处理', values: { status: 'approving' } },
  { key: 'rejected', label: '被退回的', values: { status: 'rejected' } }
]

/* 条件从 hash 里读：刷新、复制链接、后退都靠它 */
const initial = parseQuery(fromSearch(location.hash.split('?')[1] ?? ''), fields)
const state = ref<QueryState>(initial.state)
const invalid = ref(initial.invalid)

watch(
  state,
  (next) => {
    const search = toSearch(serializeQuery(next, fields))
    // 用 replace 而不是 push：每敲一个字都留一条历史记录的话，「后退」要按二十次
    history.replaceState(null, '', `#/orders${search}`)
  },
  { deep: true }
)

const result = computed(() => {
  const status = state.value.values.status as string | undefined
  const keyword = state.value.values.keyword as string | undefined
  const owners = (state.value.values.owner as string[] | undefined) ?? []
  const page = api.listOrders({ status: status as never, keyword, page: 1, pageSize: 1000 })
  const filtered = owners.length
    ? page.items.filter((o) => owners.includes(o.ownerId))
    : page.items
  const from = (state.value.page - 1) * state.value.pageSize
  return { total: filtered.length, items: filtered.slice(from, from + state.value.pageSize) }
})

const columns = [
  { key: 'id', title: '单号', width: '140px' },
  { key: 'customer', title: '客户' },
  { key: 'owner', title: '负责人', width: '110px' },
  { key: 'amount', title: '金额', width: '140px', align: 'right' as const },
  { key: 'status', title: '状态', width: '110px' }
]

const rows = computed(() =>
  result.value.items.map((o) => ({
    id: o.id,
    customer: o.customer,
    owner: personName(o.ownerId),
    amount: money(o.amount),
    status: o.status
  }))
)

function onQuery(payload: { state: QueryState }) {
  state.value = payload.state
  // 条件变了，上一条链接里的无效参数提示就过期了，留着会让人以为还在报错
  invalid.value = []
  // 条件一变，之前勾的那些行多半已经不在结果里了，留着会让人对着一批看不见的行执行操作
  picked.value = []
  scope.value = 'selected'
  outcome.value = undefined
}

function open(id: string) {
  emit('open', {
    id,
    ticket: packReturn({
      search: toSearch(serializeQuery(state.value, fields)),
      scrollY: window.scrollY,
      focusId: id
    }),
    ids: rows.value.map((r) => String(r.id))
  })
}

/* ---------- 批量操作（B07） ---------- */

const picked = ref<BulkId[]>([])
const scope = ref<BulkScope>('selected')
const outcome = ref<BulkOutcome | undefined>(undefined)
const busy = ref(false)

/**
 * 批量取消。
 *
 * 只有草稿与已通过的单能取消，别的会被服务端退回来——于是这一批注定是
 * 部分成功，而那恰恰是批量操作的常态：结果条会摊开成功与失败，
 * 重试只发失败的那几张，已经取消掉的不会被再执行一次。
 */
function runBulk(ids: BulkId[]) {
  busy.value = true
  setTimeout(() => {
    const round = bulkOutcome(
      ids.map((id) => {
        try {
          const current = api.getOrder(String(id)).order
          api.updateStatus(String(id), 'cancelled', current.revision, {
            personId: session.personId,
            roles: ['admin']
          })
          return { id, ok: true }
        } catch (e) {
          return { id, ok: false, reason: e instanceof ApiError ? e.message : String(e) }
        }
      })
    )
    outcome.value = outcome.value ? mergeOutcome(outcome.value, round) : round
    picked.value = picked.value.filter((id) => !outcome.value!.succeeded.includes(id))
    busy.value = false
  }, 400)
}
</script>

<template>
  <section class="list">
    <IQueryFilter
      v-model="state"
      :fields="fields"
      :quick-filters="quickFilters"
      :invalid="invalid"
      @change="onQuery"
    />

    <!--
      批量操作条只在有选择或有上一轮结果时出现。它要说清的是「对谁做」：
      勾了三行还是当前页全部，还是符合筛选的全部——后者会碰到用户没看见过的行。
    -->
    <IBulkBar
      :scope="scope"
      :page-ids="rows.map((r) => String(r.id))"
      :selected-ids="picked"
      :matched-total="result.total"
      :filtered="Object.keys(state.values).length > 0"
      :outcome="outcome"
      :busy="busy"
      @update:scope="(v: BulkScope) => (scope = v)"
      @execute="(sel) => runBulk(sel.ids ?? rows.map((r) => String(r.id)))"
      @retry="runBulk"
      @clear="() => { picked = []; scope = 'selected'; outcome = undefined }"
    >
      <template #actions="{ selection, run }">
        <IButton size="sm" variant="danger" :disabled="busy || selection.count === 0" @click="run">
          批量取消
        </IButton>
      </template>
    </IBulkBar>

    <ITable :columns="columns" :data="rows" row-key="id" selectable v-model:selected="picked">
      <template #id="{ row }">
        <a class="list__link" :href="`#/orders/${row.id}`" @click.prevent="open(String(row.id))">
          {{ row.id }}
        </a>
      </template>
      <template #status="{ row }">
        <ITag :type="STATUS_TONE[String(row.status)]">{{ STATUS_LABEL[String(row.status)] }}</ITag>
      </template>
    </ITable>

    <IPagination
      :total="result.total"
      :model-value="state.page"
      :page-size="state.pageSize"
      @update:model-value="(p: number) => (state = { ...state, page: p })"
    />

    <p class="list__hint">共 {{ result.total }} 条；筛选条件已写进地址，复制链接给同事能还原同一份结果。</p>
  </section>
</template>

<style scoped>
.list {
  display: grid;
  gap: var(--i-spacing-4);
  /* grid 子项默认按内容撑开：表格在 320px 上会把整页顶宽，
     min-width 0 之后由表格自己横向滚动 */
  min-width: 0;
}

.list > * {
  min-width: 0;
}

.list__link {
  color: var(--i-color-brand-text);
  text-decoration: none;
}

.list__hint {
  margin: 0;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
}
</style>
