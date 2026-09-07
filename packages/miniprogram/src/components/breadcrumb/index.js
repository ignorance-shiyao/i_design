Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    /** 留空则用图标分隔；小程序的路由用 navigator，因此 to 是页面路径 */
    separator: { type: String, value: '' }
  }
})
