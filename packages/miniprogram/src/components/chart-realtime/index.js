/**
 * 桶的合计、断流空档与读法都来自 common 的模型。
 * WXML 算不了路径，这里把折线段与断流带先摊平。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    model: { type: Object, value: null },
    title: { type: String, value: '实时滑窗' },
    selectedIndex: { type: null, value: null },
    height: { type: Number, value: 180 }
  },
  data: {
    segments: [],
    gapBands: [],
    points: [],
    marks: [],
    zeroY: 50,
    gapCount: 0
  },
  observers: {
    'model, selectedIndex': function () { this.project() }
  },
  lifetimes: { attached() { this.project() } },
  methods: {
    select(event) {
      this.triggerEvent('select', { index: Number(event.currentTarget.dataset.index) })
    },
    project() {
      const model = this.data.model
      if (!model || model.state !== 'ready') {
        this.setData({ segments: [], gapBands: [], points: [], marks: [], zeroY: 50, gapCount: 0 })
        return
      }
      const span = model.max - model.min || 1
      const yOf = (value) => 100 - ((value - model.min) / span) * 100
      const xOf = (index, count) => (count <= 1 ? 50 : (index / (count - 1)) * 100)
      const buckets = model.buckets
      const segments = []
      let points = []
      buckets.forEach((bucket, index) => {
        if (bucket.state === 'gap' || bucket.value === null) {
          if (points.length) segments.push(points.join(' '))
          points = []
          return
        }
        points.push(`${xOf(index, buckets.length)},${yOf(bucket.value)}`)
      })
      if (points.length) segments.push(points.join(' '))

      const gapBands = buckets
        .map((bucket, index) => ({ bucket, index }))
        .filter((row) => row.bucket.state === 'gap')
        .map(({ index }) => {
          const left = buckets.length <= 1 ? 0 : ((index - 0.5) / (buckets.length - 1)) * 100
          const right = buckets.length <= 1 ? 100 : ((index + 0.5) / (buckets.length - 1)) * 100
          return {
            index,
            x: Math.max(0, left),
            width: Math.min(100, right) - Math.max(0, left)
          }
        })

      this.setData({
        segments,
        gapBands,
        zeroY: yOf(0),
        gapCount: gapBands.length,
        marks: model.marks.map((mark) => ({
          ...mark,
          x: xOf(mark.bucketIndex, buckets.length)
        })),
        points: buckets
          .map((bucket, index) => ({ bucket, index }))
          .filter((row) => row.bucket.state === 'ready' && row.bucket.value !== null)
          .map(({ bucket, index }) => ({
            index,
            x: xOf(index, buckets.length),
            y: yOf(bucket.value),
            selected: this.data.selectedIndex === index
          }))
      })
    }
  }
})
