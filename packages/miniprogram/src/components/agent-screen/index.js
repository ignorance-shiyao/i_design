/**
 * AgentScreen —— 智能体屏幕。
 *
 * 难点不在画面，在围着画面的那几行字：一张静止的画面，看起来和一张卡住的
 * 画面一模一样。不写出「这张画面是什么时候的」，用户会把一次卡死当成
 * 智能体在思考，白等好几分钟。
 *
 * 状态文字、能不能接管、画面几秒前、卡住的判定都走公共层——同一块屏幕在
 * 这一端说「工作中」、在 Web 上说「正在填写收货地址」的话，读者会以为是两件事。
 *
 * WXML 不能调用函数，要显示什么都在 JS 里算好。
 */
import {
  canTakeOver,
  frameAge,
  frameStale,
  frameStaleText,
  screenAspect,
  screenStatusIcon,
  screenStatusText
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    state: { type: String, value: 'connecting' },
    /** 当前在做什么。有它就显示它——「工作中」三个字没有信息量 */
    action: { type: String, value: '' },
    frame: { type: String, value: '' },
    /** 画面的时间戳（毫秒） */
    updatedAt: { type: Number, value: 0 },
    frameWidth: { type: Number, value: 0 },
    frameHeight: { type: Number, value: 0 },
    title: { type: String, value: '智能体屏幕' }
  },
  data: {
    status: '',
    statusIcon: 'refresh',
    age: '',
    stale: false,
    canTakeOver: false,
    aspect: '16 / 10',
    busy: false,
    staleText: ''
  },
  lifetimes: {
    attached() {
      this.build()
      // 自己走一个秒表：画面的时间戳不变，但「几秒前」得一直往前走
      this.timer = setInterval(() => this.build(), 1000)
    },
    detached() {
      clearInterval(this.timer)
    }
  },
  observers: {
    'state, action, frame, updatedAt, frameWidth, frameHeight': function () {
      this.build()
    }
  },
  methods: {
    build() {
      const { state, action, updatedAt, frameWidth, frameHeight } = this.data
      const now = Date.now()
      const age = updatedAt ? frameAge(now, updatedAt) : ''
      const stale = updatedAt ? frameStale(now, updatedAt, state) : false
      this.setData({
        status: screenStatusText(state, action),
        statusIcon: screenStatusIcon(state),
        age,
        stale,
        // 「多久没动」与「什么时候的」是两句话，混用会写出「已经 44 秒前没动了」
        staleText: stale ? frameStaleText(now, updatedAt) : '',
        canTakeOver: canTakeOver(state),
        aspect: screenAspect(frameWidth, frameHeight),
        busy: state === 'connecting' || state === 'working'
      })
    },

    takeover() {
      if (!this.data.canTakeOver) return
      this.triggerEvent('takeover')
    }
  }
})
