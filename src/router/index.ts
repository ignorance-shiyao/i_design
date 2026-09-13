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
      { path: 'tokens', component: () => import('@/pages/DesignTokensPage.vue') },
      { path: 'cross-platform', component: () => import('@/pages/CrossPlatformPage.vue') },
      { path: 'catalog', component: () => import('@/pages/CatalogPage.vue') }
    ]
  },
  {
    path: '/components',
    component: DocLayout,
    children: [
      { path: '', component: () => import('@/pages/ComponentsOverviewPage.vue') },
      { path: 'button', component: () => import('@/pages/components/ButtonPage.vue') },
      { path: 'icon', component: () => import('@/pages/components/IconPage.vue') },
      { path: 'form', component: () => import('@/pages/components/FormPage.vue') },
      { path: 'input', component: () => import('@/pages/components/InputPage.vue') },
      { path: 'textarea', component: () => import('@/pages/components/TextareaPage.vue') },
      { path: 'radio', component: () => import('@/pages/components/RadioPage.vue') },
      { path: 'checkbox', component: () => import('@/pages/components/CheckboxPage.vue') },
      { path: 'tag', component: () => import('@/pages/components/TagPage.vue') },
      { path: 'switch', component: () => import('@/pages/components/SwitchPage.vue') },
      { path: 'select', component: () => import('@/pages/components/SelectPage.vue') },
      { path: 'date-picker', component: () => import('@/pages/components/DatePickerPage.vue') },
      { path: 'upload', component: () => import('@/pages/components/UploadPage.vue') },
      { path: 'avatar', component: () => import('@/pages/components/AvatarPage.vue') },
      { path: 'badge', component: () => import('@/pages/components/BadgePage.vue') },
      { path: 'collapse', component: () => import('@/pages/components/CollapsePage.vue') },
      { path: 'descriptions', component: () => import('@/pages/components/DescriptionsPage.vue') },
      { path: 'skeleton', component: () => import('@/pages/components/SkeletonPage.vue') },
      { path: 'result', component: () => import('@/pages/components/ResultPage.vue') },
      { path: 'popconfirm', component: () => import('@/pages/components/PopconfirmPage.vue') },
      { path: 'overlay', component: () => import('@/pages/components/OverlayPage.vue') },
      { path: 'tree', component: () => import('@/pages/components/TreePage.vue') },
      { path: 'cascader', component: () => import('@/pages/components/CascaderPage.vue') },
      { path: 'navigation', component: () => import('@/pages/components/NavigationPage.vue') },
      { path: 'card', component: () => import('@/pages/components/CardPage.vue') },
      { path: 'table', component: () => import('@/pages/components/TablePage.vue') },
      { path: 'pagination', component: () => import('@/pages/components/PaginationPage.vue') },
      { path: 'modal', component: () => import('@/pages/components/ModalPage.vue') },
      { path: 'divider', component: () => import('@/pages/components/DividerPage.vue') },
      { path: 'link', component: () => import('@/pages/components/LinkPage.vue') },
      {
        path: 'range-input',
        component: () => import('@/pages/components/RangeInputPage.vue')
      },
      {
        path: 'select-input',
        component: () => import('@/pages/components/SelectInputPage.vue')
      },
      { path: 'input-otp', component: () => import('@/pages/components/InputOtpPage.vue') },
      { path: 'config-provider', component: () => import('@/pages/components/ConfigProviderPage.vue') },
      { path: 'time-select', component: () => import('@/pages/components/TimeSelectPage.vue') },
      { path: 'scrollbar', component: () => import('@/pages/components/ScrollbarPage.vue') },
      { path: 'qrcode', component: () => import('@/pages/components/QrcodePage.vue') },
      {
        path: 'command-search',
        component: () => import('@/pages/components/CommandSearchPage.vue')
      },
      {
        path: 'code-block',
        component: () => import('@/pages/components/CodeBlockPage.vue')
      },
      {
        path: 'float-button',
        component: () => import('@/pages/components/FloatButtonPage.vue')
      },
      {
        path: 'sticky-tool',
        component: () => import('@/pages/components/StickyToolPage.vue')
      },
      { path: 'comment', component: () => import('@/pages/components/CommentPage.vue') },
      {
        path: 'image-viewer',
        component: () => import('@/pages/components/ImageViewerPage.vue')
      },
      {
        path: 'input-adornment',
        component: () => import('@/pages/components/InputAdornmentPage.vue')
      },
      { path: 'breadcrumb', component: () => import('@/pages/components/BreadcrumbPage.vue') },
      { path: 'steps', component: () => import('@/pages/components/StepsPage.vue') },
      { path: 'tooltip', component: () => import('@/pages/components/TooltipPage.vue') },
      { path: 'empty', component: () => import('@/pages/components/EmptyPage.vue') },
      { path: 'loading', component: () => import('@/pages/components/LoadingPage.vue') },
      { path: 'drawer', component: () => import('@/pages/components/DrawerPage.vue') },
      { path: 'message', component: () => import('@/pages/components/MessagePage.vue') },
      { path: 'tabs', component: () => import('@/pages/components/TabsPage.vue') },
      { path: 'alert', component: () => import('@/pages/components/AlertPage.vue') },
      { path: 'chat', component: () => import('@/pages/components/ChatPage.vue') },
      { path: 'layout', component: () => import('@/pages/components/LayoutPage.vue') },
      { path: 'data-display', component: () => import('@/pages/components/DataDisplayPage.vue') },
      { path: 'data-entry', component: () => import('@/pages/components/DataEntryPage.vue') },
      { path: 'chart', component: () => import('@/pages/components/ChartPage.vue') },
      { path: 'flow', component: () => import('@/pages/components/FlowPage.vue') },
      { path: 'mobile', component: () => import('@/pages/components/MobilePage.vue') }
    ]
  },
  {
    path: '/resources',
    component: DocLayout,
    children: [{ path: '', component: () => import('@/pages/ResourcesPage.vue') }]
  },
  // 不静默跳首页：用户需要知道是地址错了，而不是以为首页就是他要找的页面
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') }
]

export default createRouter({
  // hash 模式：文档站可直接部署到任意静态托管（含 GitHub Pages 子路径）而无需服务端改写
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})
