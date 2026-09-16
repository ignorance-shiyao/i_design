/**
 * 看板、人员泳道与移动动作的纯逻辑（astra.md 的 B15）。
 *
 * 这一层只有一个中心思想：**「移动一张卡」这件事只有一个实现**。
 *
 * 拖动是一条路径，右键菜单里的「移动到…」是另一条，键盘上的「移动到…」是第三条。
 * 三条各写一遍的话，同一次移动会落到三个结果——拖过去成了，用菜单却提示「不允许」，
 * 用户会以为其中一条坏了，从此只用他试出来管用的那一条。所以这里只导出一个
 * `moveCard`，三条路径都走它；能不能落、为什么不能落，也只有 `moveCheck` 一个口径。
 *
 * 随之而来的三条：
 *
 * **一、不能落的地方，在拖起来之前就要看得出来，并且说明原因。**
 * 拖着一张卡在一列上悬停半天没反应，用户的结论是「这破东西又卡了」，
 * 不是「这一列不收」。所以 `dropTargets` 一次把所有列的可落性与理由算出来，
 * 拿起卡片的那一刻就标出来。
 *
 * **二、键盘要有等价动作。**
 * 只能拖的看板，对键盘与读屏用户等于不可用；而「移动到…」菜单里的选项，
 * 必须与拖动允许落的列**完全一致**——两份清单只要有一处不同，
 * 就又变回三条路径各走各的。
 *
 * **三、跨泳道移动同时改了两件事，要说出来。**
 * 按人分泳道时，把卡片从「林岚 / 进行中」拖到「沈黎 / 待验收」，一次动了负责人
 * 与状态两个字段。只提示「已移动」的话，用户不会想到自己顺手换了负责人。
 */

export interface BoardCard {
  id: string
  title: string
  /** 在哪一列 */
  columnId: string
  /** 在哪条泳道。不分泳道时为 undefined */
  laneId?: string
  /** 这张卡自己不许动的理由（比如已归档）。有值就哪儿都去不了 */
  lockedReason?: string
}

export interface BoardColumn {
  id: string
  title: string
  /** 在制品上限。超了不许再进，但**已经在里面的不受影响** */
  wipLimit?: number
  /** 只能从这些列进来。不给表示谁都能进 */
  allowFrom?: readonly string[]
}

export interface BoardLane {
  id: string
  title: string
  /** 这条泳道不收新卡的理由（比如这个人已离职） */
  blockedReason?: string
}

export interface MoveTarget {
  columnId: string
  laneId?: string
}

export interface MoveCheck {
  allowed: boolean
  /** 不允许时的理由，给用户看的那句话。允许时是空串 */
  reason: string
}

/** 一列（在某条泳道里）现在有几张卡 */
export function countIn(
  cards: readonly BoardCard[],
  columnId: string,
  laneId?: string
): number {
  return cards.filter(
    (card) => card.columnId === columnId && (laneId === undefined || card.laneId === laneId)
  ).length
}

/**
 * 这张卡能不能落到那儿，不能的话为什么。
 *
 * **拖动、菜单、键盘三条路径都问这一个函数**——各问各的，同一次移动就会落到
 * 三个结果，用户从此只用他试出来管用的那一条。
 *
 * 判定顺序是固定的：卡片自己锁着 > 泳道不收 > 状态流转不允许 > 在制品满了。
 * 顺序一变，同一张卡会得到不同的理由，而用户按理由去解决问题——
 * 先告诉他「这一列满了」，他清空了那一列，回来发现真正的原因是卡片已归档。
 */
export function moveCheck(
  card: BoardCard,
  to: MoveTarget,
  columns: readonly BoardColumn[],
  cards: readonly BoardCard[],
  lanes: readonly BoardLane[] = []
): MoveCheck {
  if (card.lockedReason) return { allowed: false, reason: card.lockedReason }

  const sameColumn = card.columnId === to.columnId
  const sameLane = (card.laneId ?? undefined) === (to.laneId ?? undefined)
  // 原地不动永远允许：同列内重排不该被在制品上限拦住
  if (sameColumn && sameLane) return { allowed: true, reason: '' }

  if (to.laneId !== undefined && !sameLane) {
    const lane = lanes.find((l) => l.id === to.laneId)
    if (lane?.blockedReason) return { allowed: false, reason: lane.blockedReason }
  }

  const column = columns.find((c) => c.id === to.columnId)
  if (!column) return { allowed: false, reason: '这一列不存在' }

  if (!sameColumn && column.allowFrom && !column.allowFrom.includes(card.columnId)) {
    const from = columns.find((c) => c.id === card.columnId)
    return {
      allowed: false,
      reason: `「${from?.title ?? card.columnId}」不能直接进「${column.title}」`
    }
  }

  if (!sameColumn && column.wipLimit !== undefined) {
    const count = countIn(cards, to.columnId, to.laneId)
    if (count >= column.wipLimit) {
      return {
        allowed: false,
        reason: `「${column.title}」在制品已满（${count}/${column.wipLimit}），先挪走一张`
      }
    }
  }

  return { allowed: true, reason: '' }
}

export interface DropTarget extends MoveTarget {
  title: string
  allowed: boolean
  reason: string
}

/**
 * 拿起这张卡的那一刻，把**每一个**落点的可落性算出来。
 *
 * 一次全算，是为了让不能落的地方当场标出来并写上原因——拖着卡片在一列上
 * 悬停半天没反应，用户的结论是「这破东西又卡了」，而不是「这一列不收」。
 *
 * 键盘的「移动到…」菜单用的也是这份清单（见 `moveMenu`）：
 * 两份清单只要有一处不同，拖动与菜单就又变回两条路径。
 */
export function dropTargets(
  card: BoardCard,
  columns: readonly BoardColumn[],
  cards: readonly BoardCard[],
  lanes: readonly BoardLane[] = []
): DropTarget[] {
  const targets: DropTarget[] = []
  const laneList: (BoardLane | undefined)[] = lanes.length ? [...lanes] : [undefined]
  for (const lane of laneList) {
    for (const column of columns) {
      const to: MoveTarget = { columnId: column.id, laneId: lane?.id }
      const check = moveCheck(card, to, columns, cards, lanes)
      targets.push({
        ...to,
        title: lane ? `${lane.title} / ${column.title}` : column.title,
        allowed: check.allowed,
        reason: check.reason
      })
    }
  }
  return targets
}

/**
 * 键盘与右键菜单里的「移动到…」。
 *
 * 不能落的**照常列出来，禁用并写明理由**——与详情页动作、命令面板同一套口径
 * （见 `detail.ts` / `taskcenter.ts`）。过滤掉的话，用户找不到那一列，
 * 会以为看板配错了。当前所在的那一格不列：移到自己这儿不是一个动作。
 */
export function moveMenu(
  card: BoardCard,
  columns: readonly BoardColumn[],
  cards: readonly BoardCard[],
  lanes: readonly BoardLane[] = []
): DropTarget[] {
  return dropTargets(card, columns, cards, lanes).filter(
    (target) =>
      !(target.columnId === card.columnId && (target.laneId ?? undefined) === (card.laneId ?? undefined))
  )
}

export interface MoveResult {
  cards: BoardCard[]
  ok: boolean
  /** 说给用户听的那句话：成了说动了什么，没成说为什么 */
  message: string
}

/**
 * 移动一张卡。**拖动、菜单、键盘都调它**，因此三条路径的结果必然一致。
 *
 * `index` 是落在目标格里的第几位；不给就放到末尾。同列内重排也走这里——
 * 重排单独写一份的话，它会绕开 `moveCheck`，于是一张锁着的卡在原列里还能拖动。
 */
export function moveCard(
  cards: readonly BoardCard[],
  cardId: string,
  to: MoveTarget,
  columns: readonly BoardColumn[],
  lanes: readonly BoardLane[] = [],
  index?: number
): MoveResult {
  const card = cards.find((c) => c.id === cardId)
  if (!card) return { cards: [...cards], ok: false, message: '这张卡已经不在了' }

  const check = moveCheck(card, to, columns, cards, lanes)
  if (!check.allowed) return { cards: [...cards], ok: false, message: check.reason }

  const moved: BoardCard = { ...card, columnId: to.columnId, laneId: to.laneId }
  const rest = cards.filter((c) => c.id !== cardId)
  const targetIds = rest
    .filter((c) => c.columnId === to.columnId && (c.laneId ?? undefined) === (to.laneId ?? undefined))
    .map((c) => c.id)
  const anchorId =
    index === undefined || index >= targetIds.length ? null : targetIds[Math.max(0, index)]

  const next: BoardCard[] = []
  let placed = false
  for (const item of rest) {
    if (anchorId !== null && item.id === anchorId) {
      next.push(moved)
      placed = true
    }
    next.push(item)
  }
  if (!placed) next.push(moved)

  return {
    cards: next,
    ok: true,
    message: describeMove(card, to, columns, lanes)
  }
}

/**
 * 这次移动到底动了什么。
 *
 * 跨泳道时同时改了负责人与状态两件事——只说「已移动」的话，
 * 用户不会想到自己顺手换了负责人，而那正是他最需要知道的一条。
 */
export function describeMove(
  card: BoardCard,
  to: MoveTarget,
  columns: readonly BoardColumn[],
  lanes: readonly BoardLane[] = []
): string {
  const columnTitle = columns.find((c) => c.id === to.columnId)?.title ?? to.columnId
  const laneChanged = (card.laneId ?? undefined) !== (to.laneId ?? undefined)
  const columnChanged = card.columnId !== to.columnId
  if (!laneChanged && !columnChanged) return `「${card.title}」在本列内换了位置`
  if (!laneChanged) return `「${card.title}」移到了「${columnTitle}」`
  const laneTitle = lanes.find((l) => l.id === to.laneId)?.title ?? to.laneId ?? ''
  if (!columnChanged) return `「${card.title}」转给了「${laneTitle}」`
  return `「${card.title}」转给了「${laneTitle}」，并移到「${columnTitle}」（负责人与状态都变了）`
}

/**
 * 键盘上按方向键时，下一个落点是哪个。
 *
 * **跳过不能落的格子**，而不是停在上面等用户发现按了没反应。
 * 全都不能落时返回 null，由调用方保持原位并说明——
 * 悄悄不动与「按键坏了」在屏幕上是同一回事。
 */
export function nextDropTarget(
  targets: readonly DropTarget[],
  current: MoveTarget,
  delta: 1 | -1
): DropTarget | null {
  const usable = targets.filter((target) => target.allowed)
  if (!usable.length) return null
  const sameSpot = (a: MoveTarget, b: MoveTarget) =>
    a.columnId === b.columnId && (a.laneId ?? undefined) === (b.laneId ?? undefined)
  const at = usable.findIndex((target) => sameSpot(target, current))
  if (at === -1) return delta === 1 ? usable[0] : usable[usable.length - 1]
  const next = at + delta
  // 不绕回：走到头就停在头上，绕回去会让人以为自己按多了一下
  if (next < 0 || next >= usable.length) return usable[at]
  return usable[next]
}

export interface ColumnStat {
  columnId: string
  count: number
  wipLimit?: number
  /** 超了没有。**已经在里面的不赶出去**，只是不让新的再进 */
  over: boolean
  /** 列头上那句话 */
  text: string
}

/**
 * 列头上的计数。
 *
 * 在制品上限写成「3/3」而不是只写「3」：没有分母的话，
 * 用户要等到拖不进去才知道有上限这回事。
 */
export function columnStat(
  column: BoardColumn,
  cards: readonly BoardCard[],
  laneId?: string
): ColumnStat {
  const count = countIn(cards, column.id, laneId)
  const over = column.wipLimit !== undefined && count > column.wipLimit
  return {
    columnId: column.id,
    count,
    wipLimit: column.wipLimit,
    over,
    text: column.wipLimit === undefined ? `${count}` : `${count}/${column.wipLimit}`
  }
}
