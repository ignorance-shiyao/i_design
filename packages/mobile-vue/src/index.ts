/**
 * Ignorance Design · Mobile Vue
 *
 * 复用 @i-design/vue-next 的全部组件（样式经移动覆盖层调整触控尺度），
 * 并补充移动端特有形态。引入顺序很重要：先 @i-design/common/styles/index.css，后 mobile.css。
 *
 * 本文件由 scripts/build-mobile-index.mjs 按目录生成——手写清单会漏，
 * 而漏掉的组件既不会让构建失败，也不会有任何提示。
 */
export * from '@i-design/vue-next'
export { default as IActionSheet } from './components/IActionSheet.vue'
export { default as ICell } from './components/ICell.vue'
export { default as ICountDown } from './components/ICountDown.vue'
export { default as IFab } from './components/IFab.vue'
export { default as IFooter } from './components/IFooter.vue'
export { default as IGrid } from './components/IGrid.vue'
export { default as INavBar } from './components/INavBar.vue'
export { default as INoticeBar } from './components/INoticeBar.vue'
export { default as IPicker } from './components/IPicker.vue'
export { default as IPopup } from './components/IPopup.vue'
export { default as ISearchBar } from './components/ISearchBar.vue'
export { default as ISideBar } from './components/ISideBar.vue'
export { default as IStepper } from './components/IStepper.vue'
export { default as ISwipeCell } from './components/ISwipeCell.vue'
export { default as ITabbar } from './components/ITabbar.vue'
export { default as IToast } from './components/IToast.vue'
export type { ActionSheetAction } from './components/IActionSheet.vue'
export type { FooterLink } from './components/IFooter.vue'
export type { GridItem } from './components/IGrid.vue'
export type { SideBarItem } from './components/ISideBar.vue'
export type { SwipeAction } from './components/ISwipeCell.vue'
export type { TabbarItem } from './components/ITabbar.vue'

/* 命令式 API：Toast 不是挂在模板里的组件，单独导出 */
export { toast, currentToast } from './toast'
