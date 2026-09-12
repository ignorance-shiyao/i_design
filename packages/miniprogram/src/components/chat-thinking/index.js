/**
 * ChatThinking —— 推理过程，默认折叠。
 * 折叠是有意的：推理过程对排查问题有用，但它不是答案。
 */
import { defaultOpenSteps, summarizeThinking, thinkingStepIcon, toggleThinkingStep } from '@i-design/common'
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    label: { type: String, value: '' },
    duration: { type: String, value: '' },
    pending: { type: Boolean, value: false },
    defaultOpen: { type: Boolean, value: false },
    text: { type: String, value: '' },
    /** 分步轨迹。给了就按步展示，每步可单独展开；不给则仍是一整段文字 */
    steps: { type: Array, value: [] }
  },
  data: { open: false, labelText: '', rows: [], progress: '' },
  lifetimes: {
    attached() {
      this.syncLocale()
      this.setData({ open: this.data.defaultOpen })
      this.openSteps = defaultOpenSteps(this.data.steps || [])
      this.build()
    }
  },
  observers: {
    steps: function () {
      // 步骤换了一批就重算默认展开：出错的那步是新出现的，用户此刻要看的正是它
      this.openSteps = defaultOpenSteps(this.data.steps || [])
      this.build()
    }
  },
  methods: {
    /* 标题走字典：不传时用「推理过程」那一句，传了以传进来的为准 */
    syncLocale() {
      const locale = getLocale()
      this.setData({
        labelText: this.data.label || locale.thinking,
      })
    },
    build() {
      const steps = this.data.steps || []
      const summary = summarizeThinking(steps)
      this.setData({
        // 折叠时把进度顶在标题上：折叠不该连「走到第几步」一起藏掉
        progress: summary.total ? `${summary.activeIndex + 1}/${summary.total}` : '',
        rows: steps.map((step) => ({
          key: step.key,
          title: step.title,
          detail: step.detail || '',
          status: step.status || 'done',
          icon: thinkingStepIcon(step.kind),
          open: this.openSteps.includes(step.key)
        }))
      })
    },

    onToggleStep(event) {
      this.openSteps = toggleThinkingStep(this.openSteps, event.currentTarget.dataset.key)
      this.build()
    },

    onToggle() { this.setData({ open: !this.data.open }) }
  }
})
