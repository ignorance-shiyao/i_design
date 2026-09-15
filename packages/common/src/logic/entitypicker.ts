/**
 * 人员 / 组织 / 资源选择的纯逻辑（astra.md 的 B10）。
 *
 * 这类选择器看着就是「搜一下、勾几个」，但它有三件事做不对就会出真问题，
 * 而且三件都跟「远程检索 + 分页」这个前提绑在一起：
 *
 * **一、已选的东西不能依赖它还在当前这一页里。**
 * 选了第 1 页的张三，翻到第 5 页再回来，张三得还在已选里，而且**名字要显示得
 * 出来**。所以已选存的是完整对象而不是 id——远程检索的结果是分页的，
 * 手里只有 id 的话，一旦那个人不在当前结果里，界面上就只剩一串编号。
 * 「回显」丢的往往不是选择本身，是选择的名字。
 *
 * **二、不能选的要说清为什么，而不是消失。**
 * 没权限的、超出上限的、已经被别人占用的——直接从列表里过滤掉，用户会一直搜
 * 一直搜，怀疑是自己名字打错了。留在那儿、灰着、旁边一句话，他才会去找管理员。
 *
 * **三、停用的实体仍然要能读历史记录。**
 * 这条最容易写错：停用的人不能再被选中，于是有人顺手把他从数据里过滤掉，
 * 结果三年前那张单上的负责人变成了一个空格。正确的做法是分开两件事——
 * **不能新选**，但**已经选上的照常显示、照常能移除**，并且明确标出「已停用」。
 */

export interface EntityOption {
  id: string
  label: string
  /** 二级说明：部门、工号、资源类型——同名的两个人只能靠它分得开 */
  hint?: string
  /**
   * 不能新选的原因（没权限、已被占用……）。给了就不可选。
   * 注意：它只挡「新选」，不挡「已经选上的那些」。
   */
  blockedReason?: string
  /** 已停用。不能新选，但已经选上的照常显示、照常能移除 */
  inactive?: boolean
}

export interface PickerInput {
  /** 当前这一页的检索结果 */
  page: readonly EntityOption[]
  /** 已选。存的是完整对象而不是 id——回显不能依赖它还在当前页里 */
  chosen: readonly EntityOption[]
  multiple?: boolean
  /** 最多选几个。到了上限之后其余项不可选，并说明原因 */
  max?: number
}

export interface PickerRow extends EntityOption {
  selected: boolean
  disabled: boolean
  /** 不可选的原因。disabled 为 true 时一定不是空串 */
  reason: string
}

const isChosen = (chosen: readonly EntityOption[], id: string) => chosen.some((c) => c.id === id)

/**
 * 当前这一页每一行的状态。
 *
 * 一条贯穿始终的规则：**已经选上的项永远可以点**（点一下是取消选择）。
 * 上限、停用、没权限都只挡新选——否则用户会被自己锁死：选满十个之后，
 * 连取消其中一个都点不动。
 */
export function pickerRows(input: PickerInput): PickerRow[] {
  const { chosen, max } = input
  const full = max !== undefined && chosen.length >= max
  return input.page.map((item) => {
    const selected = isChosen(chosen, item.id)
    let reason = ''
    if (!selected) {
      if (item.blockedReason) reason = item.blockedReason
      // 停用与没权限分开说：前者是「这个人还在，只是不该再派新活」
      else if (item.inactive) reason = '已停用，只能保留原有的'
      else if (full) reason = `最多选 ${max} 个`
    }
    return { ...item, selected, disabled: reason !== '', reason }
  })
}

/**
 * 点一下某一项之后，已选变成什么。
 *
 * 已选顺序按先后保持，不跟着检索结果重排——重排会让用户以为自己点错了，
 * 回头去数一遍。
 */
export function togglePick(input: PickerInput, id: string): EntityOption[] {
  const rows = pickerRows(input)
  const row = rows.find((r) => r.id === id)
  if (!row) return [...input.chosen]
  if (row.selected) return input.chosen.filter((c) => c.id !== id)
  if (row.disabled) return [...input.chosen]

  const picked: EntityOption = {
    id: row.id,
    label: row.label,
    ...(row.hint === undefined ? {} : { hint: row.hint }),
    ...(row.blockedReason === undefined ? {} : { blockedReason: row.blockedReason }),
    ...(row.inactive === undefined ? {} : { inactive: row.inactive })
  }
  // 单选就是替换，不是追加
  if (!input.multiple) return [picked]
  return [...input.chosen, picked]
}

/** 移除一个已选项。它不走 pickerRows，因为要移除的那个多半不在当前页里 */
export function removePick(chosen: readonly EntityOption[], id: string): EntityOption[] {
  return chosen.filter((c) => c.id !== id)
}

/**
 * 已选里有哪些不在当前这一页。
 *
 * 界面要靠它把这些项**额外显示出来**——只渲染当前页的话，翻一页就看不见
 * 自己选了谁，而这正是「分页选择丢失」最常见的表现：数据没丢，是看不见了。
 */
export function offPageChosen(
  chosen: readonly EntityOption[],
  page: readonly EntityOption[]
): EntityOption[] {
  const onPage = new Set(page.map((p) => p.id))
  return chosen.filter((c) => !onPage.has(c.id))
}

/** 已选里有几个是停用的。它们仍然算数，只是要标出来 */
export function inactiveChosen(chosen: readonly EntityOption[]): EntityOption[] {
  return chosen.filter((c) => c.inactive)
}

export interface PickerSummary {
  count: number
  /** 「已选 3 人 / 最多 5 人」。到上限时这句话本身就是解释 */
  text: string
  /** 到上限了吗 */
  full: boolean
  /** 已选里含停用项时的提醒。没有就是空串 */
  notice: string
}

export function pickerSummary(
  chosen: readonly EntityOption[],
  max?: number,
  unit = '项'
): PickerSummary {
  const count = chosen.length
  const full = max !== undefined && count >= max
  const inactive = inactiveChosen(chosen).length
  return {
    count,
    text: max === undefined ? `已选 ${count} ${unit}` : `已选 ${count} / ${max} ${unit}`,
    full,
    // 不说「请移除」：历史记录里的停用项本来就该留着
    notice: inactive ? `其中 ${inactive} ${unit}已停用，保留自历史记录` : ''
  }
}

/**
 * 检索框里该给什么提示。
 *
 * 远程检索的空结果与「还没开始搜」是两件事，说成同一句话会让人以为库里没人。
 */
export function pickerHint(keyword: string, loading: boolean, resultCount: number): string {
  if (loading) return '检索中…'
  if (!keyword.trim()) return '输入姓名、工号或部门开始检索'
  if (resultCount === 0) return `没有匹配「${keyword.trim()}」的结果`
  return ''
}
