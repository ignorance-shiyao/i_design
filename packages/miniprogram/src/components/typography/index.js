/**
 * Typography —— 标题、正文与辅助文字。
 *
 * 小程序没有 h1-h5 标签，层级只体现在样式上；因此这里不像 Web 端那样
 * 按 variant 换标签，语义交给页面自己的结构表达。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    variant: { type: String, value: 'body' },
    type: { type: String, value: 'default' },
    text: { type: String, value: '' },
    strong: { type: Boolean, value: false },
    italic: { type: Boolean, value: false },
    underline: { type: Boolean, value: false },
    del: { type: Boolean, value: false },
    mono: { type: Boolean, value: false },
    ellipsis: { type: Boolean, value: false },
    lines: { type: Number, value: 0 }
  }
})
