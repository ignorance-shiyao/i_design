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
import OrderList from './pages/OrderList.vue'
import OrderCreate from './pages/OrderCreate.vue'
import OrderDetail from './pages/OrderDetail.vue'

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
</script>

<template>
  <AppShell app-id="erp" :nav="nav" :current="view.name === 'list' ? '/orders' : '/orders/new'" :crumbs="crumbs" @navigate="go">
    <template #actions>
      <a v-if="view.name !== 'new'" class="erp__action" href="#/orders/new">新建订单</a>
      <a v-if="view.name !== 'list'" class="erp__action" href="#/orders">返回列表</a>
    </template>

    <OrderList v-if="view.name === 'list'" @open="(id: string) => go(`/orders/${id}`)" />
    <OrderCreate v-else-if="view.name === 'new'" @created="(id: string) => go(`/orders/${id}`)" />
    <OrderDetail v-else :id="view.id" @back="() => go('/orders')" />
  </AppShell>
</template>

<style scoped>
.erp__action {
  color: var(--i-color-brand-text);
  font-size: var(--i-font-size-sm);
  text-decoration: none;
}
</style>
