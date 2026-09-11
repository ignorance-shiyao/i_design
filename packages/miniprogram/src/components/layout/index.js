/**
 * Layout —— 页面骨架。
 *
 * 小程序没有 header / aside / main 这些语义标签，只能用 view；
 * 无障碍语义由页面自身的 aria-role 补，组件这一层给不了。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    asidePlacement: { type: String, value: 'left' },
    collapsed: { type: Boolean, value: false },
    /** 是否渲染对应的区块：小程序无法从插槽内容反推 */
    hasHeader: { type: Boolean, value: false },
    hasAside: { type: Boolean, value: false },
    hasFooter: { type: Boolean, value: false }
  }
})
