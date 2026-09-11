Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    /** 固定前缀，例如 https:// */
    prepend: { type: String, value: '' },
    /** 固定后缀，例如 .com、元 */
    append: { type: String, value: '' }
  }
})
