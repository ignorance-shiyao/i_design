/**
 * ChatList —— 会话列表。
 *
 * 分组规则、空标题的兜底、删除之后选谁都走公共层：
 * 一端删掉当前这条后弹回顶部、另一端选后一条的话，同一个操作在两端是两种体验。
 *
 * WXML 不能调用函数，分组与标题都在 JS 里算好再塞进 data。
 */
import {
  accessReasonOf,
  canOpenSession,
  filterSessions,
  groupSessions,
  nextAfterDelete,
  sessionTitle,
  visibleSessions
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    sessions: { type: Array, value: [] },
    active: { type: String, value: '' },
    /** 会话多了才需要搜索框；少几条时那个框只是占地方 */
    searchAfter: { type: Number, value: 8 },
    /** 看未归档的还是已归档的。两个视图互不包含 */
    view: { type: String, value: 'active' }
  },
  data: { groups: [], query: '', showSearch: false, empty: false, emptyText: '' },
  lifetimes: {
    attached() {
      this.build()
    }
  },
  observers: {
    'sessions, active, view': function () {
      this.build()
    }
  },
  methods: {
    build() {
      const { sessions, searchAfter, query, view } = this.data
      // 先按视图分，再按关键词过滤：搜索不该把归档的会话搜出来混在里面
      const shown = filterSessions(visibleSessions(sessions, view), query)
      // 分组的「现在」每次都取一次：跨过零点之后「今天」得变成「昨天」
      const groups = groupSessions(shown, Date.now()).map((group) => ({
        key: group.key,
        label: group.label,
        sessions: group.sessions.map((s) => ({
          id: s.id,
          pinned: !!s.pinned,
          archived: !!s.archived,
          // 标题为空时用摘要顶上：显示空白的话，用户会以为这条会话坏了
          title: sessionTitle(s),
          // 打不开的原因分「没权限」与「已失效」：都写成打不开会让人一直重试
          reason: accessReasonOf(s),
          reasonIcon: s.access === 'forbidden' ? 'lock' : 'history',
          disabled: !canOpenSession(s)
        }))
      }))
      this.setData({
        groups,
        showSearch: sessions.length > searchAfter,
        empty: groups.length === 0,
        // 搜不到时说清楚是搜不到，让列表空着看起来像会话全没了
        emptyText: query ? `没有匹配「${query}」的会话` : '还没有会话'
      })
    },

    archive(e) {
      const { id } = e.currentTarget.dataset
      const session = this.data.sessions.find((s) => s.id === id)
      this.triggerEvent('archive', { id, archived: !session?.archived })
    },

    onQuery(e) {
      this.setData({ query: e.detail.value }, () => this.build())
    },

    pick(e) {
      this.triggerEvent('activechange', { id: e.currentTarget.dataset.id })
    },

    create() {
      this.triggerEvent('create')
    },

    pin(e) {
      this.triggerEvent('pin', { id: e.currentTarget.dataset.id })
    },

    remove(e) {
      const id = e.currentTarget.dataset.id
      // 先算好接下来选谁，再把删除抛出去：抛出去之后列表已经变了，算不准了。
      // 传的是分好组的列表——「后一条」说的是用户看到的下一条，不是数组里的下一个
      const next = nextAfterDelete(
        groupSessions(filterSessions(this.data.sessions, this.data.query), Date.now()),
        id,
        this.data.active
      )
      this.triggerEvent('remove', { id })
      if (next !== this.data.active) this.triggerEvent('activechange', { id: next })
    }
  }
})
