import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import DocLayout from '@/site/DocLayout.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  {
    path: '/design',
    component: DocLayout,
    children: [
      { path: '', redirect: '/design/values' },
      { path: 'values', component: () => import('@/pages/DesignValuesPage.vue') },
      { path: 'tokens', component: () => import('@/pages/DesignTokensPage.vue') }
    ]
  },
  {
    path: '/components',
    component: DocLayout,
    children: [
      { path: '', redirect: '/components/button' },
      { path: 'button', component: () => import('@/pages/components/ButtonPage.vue') },
      { path: 'input', component: () => import('@/pages/components/InputPage.vue') },
      { path: 'tag', component: () => import('@/pages/components/TagPage.vue') },
      { path: 'switch', component: () => import('@/pages/components/SwitchPage.vue') },
      { path: 'select', component: () => import('@/pages/components/SelectPage.vue') },
      { path: 'card', component: () => import('@/pages/components/CardPage.vue') },
      { path: 'table', component: () => import('@/pages/components/TablePage.vue') },
      { path: 'pagination', component: () => import('@/pages/components/PaginationPage.vue') },
      { path: 'modal', component: () => import('@/pages/components/ModalPage.vue') },
      { path: 'tabs', component: () => import('@/pages/components/TabsPage.vue') },
      { path: 'alert', component: () => import('@/pages/components/AlertPage.vue') }
    ]
  },
  {
    path: '/resources',
    component: DocLayout,
    children: [{ path: '', component: () => import('@/pages/ResourcesPage.vue') }]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default createRouter({
  // hash 模式：文档站可直接部署到任意静态托管（含 GitHub Pages 子路径）而无需服务端改写
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})
