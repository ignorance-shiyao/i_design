/**
 * Board —— 看板与人员泳道（astra.md 的 B15）。
 *
 * 小程序上没有 HTML5 拖放，这里走「点一下拿起 → 点目标格子放下」——
 * 它与网页端的拖动、菜单**调的是同一个 moveCard**，因此结果一致。
 * 各写一遍的话，同一次移动在网页上成了、在小程序里却提示不允许。
 *
 * 落不下的格子在拿起卡片的那一刻就压暗并写出理由：
 * 点半天没反应，用户的结论是「这破东西又卡了」，不是「这一列不收」。
 */
import { columnStat, dropTargets, moveCard, moveMenu } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    cards: { type: Array, value: [] },
    columns: { type: Array, value: [] },
    /** 人员泳道。不给就是一张平看板 */
    lanes: { type: Array, value: [] }
  },
  data: { picked: '', pickedTitle: '', lanesView: [], menu: [] },
  observers: {
    'cards, columns, lanes': function () {
      this.refresh()
    }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const d = this.data
      const pickedCard = d.cards.filter((c) => c.id === d.picked)[0] || null
      /* 拿起的那一刻一次算完：每个格子能不能落、不能的理由是什么 */
      const targets = pickedCard ? dropTargets(pickedCard, d.columns, d.cards, d.lanes) : []
      const find = (columnId, laneId) =>
        targets.filter((t) => t.columnId === columnId && (t.laneId || '') === (laneId || ''))[0]

      const laneList = d.lanes.length ? d.lanes : [null]
      const lanesView = laneList.map((lane) => ({
        key: lane ? lane.id : '__flat__',
        title: lane ? lane.title : '',
        blockedReason: lane ? lane.blockedReason || '' : '',
        cells: d.columns.map((column) => {
          const target = find(column.id, lane ? lane.id : '')
          const stat = columnStat(column, d.cards, lane ? lane.id : undefined)
          return {
            key: column.id,
            laneId: lane ? lane.id : '',
            title: column.title,
            count: stat.text,
            over: stat.over,
            droppable: !!pickedCard && !!target && target.allowed,
            blocked: !!pickedCard && !!target && !target.allowed,
            reason: pickedCard && target && !target.allowed ? target.reason : '',
            cards: d.cards
              .filter(
                (card) =>
                  card.columnId === column.id && (card.laneId || '') === (lane ? lane.id : '')
              )
              .map((card) => ({
                id: card.id,
                title: card.title,
                locked: !!card.lockedReason,
                lockedReason: card.lockedReason || '',
                picked: card.id === d.picked
              }))
          }
        })
      }))

      this.setData({
        lanesView,
        pickedTitle: pickedCard ? pickedCard.title : '',
        // 「移动到…」与拖动是同一份清单：落不下的也列出来并写明理由
        menu: pickedCard
          ? moveMenu(pickedCard, d.columns, d.cards, d.lanes).map((t) => ({
              key: (t.laneId || '') + '/' + t.columnId,
              columnId: t.columnId,
              laneId: t.laneId || '',
              title: t.title,
              allowed: t.allowed,
              reason: t.reason
            }))
          : []
      })
    },
    onPick(e) {
      const id = e.currentTarget.dataset.id
      const card = this.data.cards.filter((c) => c.id === id)[0]
      // 锁着的卡拿不起来，但理由一直写在卡上，用户不必反复试
      if (!card || card.lockedReason) return
      this.setData({ picked: this.data.picked === id ? '' : id }, () => this.refresh())
    },
    /** 点格子放下、点菜单移动，都落到这里——与网页端同一个 moveCard */
    commit(columnId, laneId) {
      const d = this.data
      if (!d.picked) return
      const result = moveCard(
        d.cards,
        d.picked,
        { columnId, laneId: laneId || undefined },
        d.columns,
        d.lanes
      )
      this.triggerEvent('moved', { message: result.message, ok: result.ok })
      if (!result.ok) return
      this.triggerEvent('cardschange', { cards: result.cards })
      this.setData({ picked: '' }, () => this.refresh())
    },
    onDrop(e) {
      this.commit(e.currentTarget.dataset.column, e.currentTarget.dataset.lane)
    },
    onMenu(e) {
      this.commit(e.currentTarget.dataset.column, e.currentTarget.dataset.lane)
    }
  }
})
