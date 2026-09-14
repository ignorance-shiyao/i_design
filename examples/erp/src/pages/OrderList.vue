<script setup lang="ts">
/**
 * 订单列表：查询筛选 + 表格 + 分页。
 *
 * 筛选条件走 IQueryFilter 与共用的查询状态机，条件一变回第一页；
 * 条件同时写进 hash 的 query 部分，刷新与「复制链接给同事」都能还原——
 * 这正是 B03 那份契约要证明的事。
 */
import { computed, ref, watch } from 'vue'
import { IPagination, IQueryFilter, ITable, ITag } from '@i-design/vue-next'
import {
  fromSearch,
  parseQuery,
  serializeQuery,
  toSearch,
  type FilterField,
  type QueryState,
  type QuickFilter
} from '@i-design/common'
import { STATUS_LABEL, STATUS_TONE, api, money, personName, staff } from '../data'

const emit = defineEmits<{ open: [id: string] }>()

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

    <ITable :columns="columns" :data="rows" row-key="id">
      <template #id="{ row }">
        <a class="list__link" :href="`#/orders/${row.id}`" @click.prevent="emit('open', String(row.id))">
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
