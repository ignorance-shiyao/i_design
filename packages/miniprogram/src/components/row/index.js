/** Row —— 24 栅格的行；列间距由行统一控制 */
Component({
  options: { addGlobalClass: true },
  properties: {
    gutter: { type: Number, value: 16 },
    align: { type: String, value: 'top' },
    justify: { type: String, value: 'start' }
  }
})
