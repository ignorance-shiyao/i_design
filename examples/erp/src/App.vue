<script setup lang="ts">
/**
 * ERP 第一切片（astra.md 的 G03）：订单列表 → 新建 → 详情 → 状态流转。
 *
 * 用 hash 做路由，不引 vue-router：示例是多页构建、要能从任意子路径打开，
 * hash 是唯一不依赖服务端配置的方案。三个视图共享一个 api 实例。
 *
 * 这一版覆盖的分支——每一条都是真的会发生、且最容易被示例跳过的：
 * 成功、校验失败（没有明细）、403（审批自己的单据）、409（详情页停留期间
 * 别人改过）、重复提交（同一个幂等键返回同一张单，而不是开出两张）。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { IconName } from '@i-design/common'
import AppShell from '@i-design/examples-shell/AppShell.vue'
import { personName, session } from './data'
import OrderList from './pages/OrderList.vue'
import OrderCreate from './pages/OrderCreate.vue'
import OrderDetail from './pages/OrderDetail.vue'

/*
 * 从列表点进详情时带过来的两样东西：返回票据（筛选、页码、滚动位置）与
 * 这一页的 id 列表（详情页的上一条 / 下一条要用）。
 * 直接从地址里读的话，返回时只能落回第一页顶部——等于把用户翻的七页作废。
 */
const returnTicket = ref('')
const siblingIds = ref<string[]>([])

const route = ref(location.hash.replace(/^#/, '') || '/orders')
const onHash = () => (route.value = location.hash.replace(/^#/, '') || '/orders')
onMounted(() => window.addEventListener('hashchange', onHash))
onUnmounted(() => window.removeEventListener('hashchange', onHash))

const view = computed(() => {
  if (route.value.startsWith('/orders/new')) return { name: 'new' as const, id: '' }
  const match = route.value.match(/^\/orders\/(.+)$/)
  return match ? { name: 'detail' as const, id: match[1] } : { name: 'list' as const, id: '' }
})

const crumbs = computed(() => {
  if (view.value.name === 'new') return [{ label: '销售订单' }, { label: '新建' }]
  if (view.value.name === 'detail') return [{ label: '销售订单' }, { label: view.value.id }]
  return [{ label: '销售订单' }]
})

const nav: { key: string; label: string; icon: IconName }[] = [
  { key: '/orders', label: '销售订单', icon: 'file-text' },
  { key: '/orders/new', label: '新建订单', icon: 'plus' }
]

const go = (key: string) => {
  location.hash = key
}

/** 列表交出来的三样：去哪一张单、怎么回来、这一页还有哪些单 */
function openOrder(payload: { id: string; ticket: string; ids: string[] }) {
  returnTicket.value = payload.ticket
  siblingIds.value = payload.ids
  go(`/orders/${payload.id}`)
}
</script>

<template>
  <!--
    顶栏里的名字必须是 data.ts 里那个 session 的人：壳自己有个默认名字，
    用默认的话，界面上写着「林岚」而实际以「沈野」的身份在操作——
    「不能审批自己提交的单据」这条规则一出现，就没人说得清到底是谁的单。
  -->
  <AppShell app-id="erp" :user="`${personName(session.personId)}（销售经理）`" :nav="nav" :current="view.name === 'list' ? '/orders' : '/orders/new'" :crumbs="crumbs" @navigate="go">
    <template #actions>
      <a v-if="view.name !== 'new'" class="erp__action" href="#/orders/new">新建订单</a>
      <a v-if="view.name !== 'list'" class="erp__action" href="#/orders">返回列表</a>
    </template>

    <OrderList v-if="view.name === 'list'" @open="openOrder" />
    <OrderCreate
      v-else-if="view.name === 'new'"
      @created="(id: string) => go(`/orders/${id}`)"
      @cancelled="() => go('/orders')"
    />
    <OrderDetail
      v-else
      :id="view.id"
      :sibling-ids="siblingIds"
      :return-ticket="returnTicket"
      @back="() => go('/orders')"
      @open="(id: string) => go(`/orders/${id}`)"
    />
  </AppShell>
</template>

<style scoped>
.erp__action {
  color: var(--i-color-brand-text);
  font-size: var(--i-font-size-sm);
  text-decoration: none;
}
</style>
