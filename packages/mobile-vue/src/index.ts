/**
 * Ignorance Design · Mobile Vue
 *
 * 复用 @i-design/vue-next 的全部组件（样式经移动覆盖层调整触控尺度），
 * 并补充移动端特有形态：Cell、ActionSheet、Toast。
 * 引入顺序很重要：先 @i-design/common/styles/index.css，后 mobile.css。
 *
 * 与 mobile-react 保持同一种做法：此前这里只导出三个移动组件，
 * 使用方得同时装两个包才能拿到按钮和输入框，两端用法平白分叉。
 */
export * from '@i-design/vue-next'
export { default as ICell } from './components/ICell.vue'
export { default as IActionSheet } from './components/IActionSheet.vue'
export { default as IToast } from './components/IToast.vue'
export { toast, currentToast } from './toast'
