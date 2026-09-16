/**
 * Thread —— 评论线程与活动记录（astra.md 的 B14）。
 *
 * 人说的话与系统记的账按时间穿插在一条时间轴上——分成两个标签页的话，
 * 读者永远拼不出「当时到底发生了什么」。
 *
 * 组件不碰任何 IO：发送、删除、重发都交给页面。判断走 logic/thread.ts，
 * 五端共用一份。
 */
import {
  DELETED_BODY,
  editNote,
  keepDivider,
  readUpTo,
  threadItems,
  unreadState
} from '@i-design/common'

/* 小程序的 WXML 铺不了递归结构，这里把树摊成一串带缩进的行 */
function flatten(node, out) {
  out.push(node)
  for (const reply of node.replies) flatten(reply, out)
  return out
}

Component({
  options: { addGlobalClass: true },
  properties: {
    entries: { type: Array, value: [] },
    /** 我是谁。自己说的话不算未读 */
    meId: { type: String, value: '' },
    lastReadAt: { type: Number, value: 0 }
  },
  data: { rows: [], unreadText: '', unreadCount: 0, dividerId: '', deletedBody: DELETED_BODY },
  observers: {
    entries: function () {
      this.refresh()
    }
  },
  lifetimes: {
    attached() {
      // 未读分隔线在打开的那一刻钉死：跟着新评论往下跑的话，用户会丢掉读到哪儿
      const state = unreadState(this.data.entries, this.data.lastReadAt, this.data.meId)
      this._unread = state
      this.refresh()
    }
  },
  methods: {
    refresh() {
      const d = this.data
      const previous = this._unread || unreadState(d.entries, d.lastReadAt, d.meId)
      // 计数照常涨，分隔线不动
      const unread = keepDivider(previous, d.entries, d.lastReadAt, d.meId)
      this._unread = unread

      const format = (ms) => new Date(ms).toLocaleString('zh-CN')
      const rows = []
      for (const item of threadItems(d.entries)) {
        if (item.kind === 'activity') {
          rows.push({
            key: item.activities[0].id,
            activity: true,
            summary: item.summary,
            changes: item.activities.length > 1 ? item.activities.map((a) => a.change) : []
          })
          continue
        }
        for (const node of flatten(item.node, [])) {
          const comment = node.comment
          rows.push({
            key: comment.id,
            activity: false,
            reply: !!comment.parentId,
            tombstone: node.tombstone,
            author: comment.authorName,
            time: format(comment.createdAt),
            body: comment.body,
            edited: editNote(comment, format),
            sending: comment.sendState === 'sending',
            failed: comment.sendState === 'failed',
            failReason: comment.sendError || '网络没连上'
          })
        }
      }
      this.setData({
        rows,
        unreadText: unread.text,
        unreadCount: unread.count,
        dividerId: unread.dividerId || ''
      })
    },
    onReply(e) { this.triggerEvent('reply', { id: e.currentTarget.dataset.id }) },
    onRetry(e) { this.triggerEvent('retry', { id: e.currentTarget.dataset.id }) },
    onDiscard(e) { this.triggerEvent('discard', { id: e.currentTarget.dataset.id }) },
    onJump() { this.triggerEvent('jump', { id: this.data.dividerId }) },
    onReadAll() {
      this.triggerEvent('read', {
        lastReadAt: readUpTo(this.data.entries, this.data.lastReadAt)
      })
    }
  }
})
