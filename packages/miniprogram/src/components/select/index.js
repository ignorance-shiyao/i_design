import { collapseTags, shouldVirtualize, toggleValue, virtualWindow } from '@i-design/common'
import { getLocale } from '../../config'

/**
 * Select —— 选项禁用、多选取值、标签折叠与虚拟窗口的规则都来自公共层，
 * 与 Web 端同一份实现。
 *
 * 小程序没有 hover 与 Teleport，因此面板是紧跟触发器的一层绝对定位视图，
 * 而不是挂到根节点的浮层。长列表用 scroll-view 加上下两块空白撑开，
 * 行高靠 createSelectorQuery 实测一次——这一端读不到 offsetHeight，
 * 量不到时退回 optionHeight，而不是拿一个写死的数去算位置。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: null, value: '' },
    options: { type: Array, value: [] },
    /** 不传时用字典里的「请选择」，由 config.js 决定是哪种语言 */
    placeholder: { type: String, value: '' },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    clearable: { type: Boolean, value: false },
    multiple: { type: Boolean, value: false },
    maxTagCount: { type: Number, value: 0 },
    /** 量不到行高时的兜底值（px） */
    optionHeight: { type: Number, value: 40 },
    /** 面板高度（px），与样式里的 max-height 对应 */
    menuHeight: { type: Number, value: 240 },
    emptyText: { type: String, value: '无匹配选项' }
  },
  data: {
    /* 传了就用传的，没传才回落到字典——组件自己的默认值不该盖过调用方 */
    placeholderText: '',
    emptyLabel: '',
    open: false,
    label: '',
    hasValue: false,
    tags: [],
    restCount: 0,
    virtual: false,
    visible: [],
    paddingTop: 0,
    paddingBottom: 0,
    rowHeight: 40,
    scrollTop: 0
  },
  observers: {
    'value, options, multiple, maxTagCount': function () {
      this.refresh()
    }
  },
  methods: {
    /** 当前选中的值，单选也归一成数组，免得下面到处分叉 */
    values() {
      const { value, multiple } = this.data
      if (multiple) return Array.isArray(value) ? value : []
      return value === '' || value === null || value === undefined ? [] : [value]
    },
    syncLocale() {
      const locale = getLocale()
      this.setData({
        placeholderText: this.data.placeholder || locale.placeholder,
        emptyLabel: this.data.emptyText || locale.noMatch
      })
    },
    refresh() {
      this.syncLocale()
      const { options, multiple, maxTagCount } = this.data
      const values = this.values()
      const picked = values.map((v) => options.find((o) => o.value === v)).filter(Boolean)
      const { shown, rest } = collapseTags(picked, maxTagCount)
      this.setData({
        hasValue: picked.length > 0,
        label: multiple ? '' : picked.length ? picked[0].label : '',
        tags: shown,
        restCount: rest
      })
      this.window()
    },
    /**
     * 只渲染看得见的那十来行；条数不多时整份渲染，省掉一次计算。
     *
     * 「选中了没有」在这里就算好写进每一项：WXML 里调不了数组方法，
     * 把判断留到模板上会变成一串写死的比较，多选时根本表达不出来。
     */
    window() {
      const { options, scrollTop, rowHeight, menuHeight } = this.data
      const values = this.values()
      const wrap = (option, index) => ({
        label: option.label,
        value: option.value,
        disabled: !!option.disabled,
        selected: values.indexOf(option.value) >= 0,
        index
      })

      if (!shouldVirtualize(options.length)) {
        this.setData({ virtual: false, visible: options.map(wrap) })
        return
      }
      const win = virtualWindow(scrollTop, menuHeight, rowHeight, options.length)
      const visible = []
      for (let i = win.start; i <= win.end; i++) visible.push(wrap(options[i], i))
      this.setData({
        virtual: true,
        visible,
        paddingTop: win.paddingTop,
        paddingBottom: win.paddingBottom
      })
    },
    measure() {
      const query = this.createSelectorQuery()
      query.select('.i-select__option').boundingClientRect()
      query.exec((res) => {
        const rect = res && res[0]
        if (rect && rect.height > 0 && rect.height !== this.data.rowHeight) {
          this.setData({ rowHeight: rect.height }, () => this.window())
        }
      })
    },
    onToggle() {
      if (this.data.disabled) return
      const open = !this.data.open
      this.setData({ open })
      if (open) {
        this.window()
        this.measure()
      }
    },
    onScroll(e) {
      this.setData({ scrollTop: e.detail.scrollTop }, () => this.window())
    },
    onPick(e) {
      const { value, disabled } = e.currentTarget.dataset
      if (disabled) return
      if (this.data.multiple) {
        // 多选不收起面板：一次要选好几个，每选一个都收起来再展开是折磨
        this.triggerEvent('change', { value: toggleValue(this.values(), value) })
        return
      }
      this.setData({ open: false })
      this.triggerEvent('change', { value })
    },
    onRemoveTag(e) {
      if (this.data.disabled) return
      this.triggerEvent('change', { value: toggleValue(this.values(), e.currentTarget.dataset.value) })
    },
    onClear() {
      // 阻止冒泡到触发器，否则清空的同时又把面板打开了
      this.setData({ open: false })
      this.triggerEvent('change', { value: this.data.multiple ? [] : '' })
    },
    onClose() { this.setData({ open: false }) }
  }
})
