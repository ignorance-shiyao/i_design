Component({
  options: { addGlobalClass: true },
  properties: {
    author: { type: String, value: '' },
    /** 已经格式化好的时间文案 */
    datetime: { type: String, value: '' },
    content: { type: String, value: '' },
    /** 被回复的原文 */
    quote: { type: String, value: '' },
    avatar: { type: String, value: '' },
    reply: { type: Boolean, value: false }
  }
})
