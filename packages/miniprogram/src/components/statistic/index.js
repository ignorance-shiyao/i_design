/** Statistic —— 一个关键数字；格式化规则与 Web 端逐字对应 */
Component({
  options: { addGlobalClass: true },
  properties: {
    title: { type: String, value: '' },
    value: { type: null, value: 0 },
    prefix: { type: String, value: '' },
    suffix: { type: String, value: '' },
    precision: { type: Number, value: 0 },
    separator: { type: Boolean, value: true },
    type: { type: String, value: 'default' },
    size: { type: String, value: 'md' },
    trend: { type: Number, value: 0 },
    extra: { type: String, value: '' }
  },
  data: { display: '', trendAbs: 0 },
  observers: {
    'value, precision, separator, trend': function (value, precision, separator, trend) {
      this.setData({ display: this.format(value, precision, separator), trendAbs: Math.abs(trend) })
    }
  },
  methods: {
    format(value, precision, separator) {
      if (typeof value !== 'number') return String(value)
      const fixed = value.toFixed(precision)
      if (!separator) return fixed
      // 只给整数部分加分隔符，小数部分保持原样
      const [int, decimal] = fixed.split('.')
      const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return decimal ? `${grouped}.${decimal}` : grouped
    }
  }
})
