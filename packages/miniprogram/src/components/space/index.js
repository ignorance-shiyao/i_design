/** Space —— 把相邻元素间距收敛到令牌上 */
Component({
  options: { addGlobalClass: true },
  properties: {
    direction: { type: String, value: 'horizontal' },
    size: { type: String, value: 'md' },
    align: { type: String, value: 'start' },
    wrap: { type: Boolean, value: false },
    block: { type: Boolean, value: false }
  }
})
