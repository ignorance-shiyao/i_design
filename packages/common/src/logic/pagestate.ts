/**
 * 页面状态的判定逻辑。
 *
 * 一块内容区在真实系统里有七种样子：加载中、空、无权限、失败、离线、
 * 部分成功、数据过期。它们在开发机上只看得到前两种，所以后五种的界面
 * 通常是「写了但没人看过」——而用户最需要提示的恰恰是那五种。
 *
 * 这里只决定「该显示哪一种、说什么、能做什么」，渲染由各端自己做。
 * 判定放在共享层的理由很实在：同一批条件在五个端各判一次，
 * 一定会在某个端上把「部分成功」判成「失败」，然后把已经成功的那批数据清空。
 */
export type PageStateKind =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'forbidden'
  | 'failed'
  | 'offline'
  | 'partial'
  | 'stale'

export interface PageStateInput {
  loading?: boolean
  /** 网络是否可用；离线优先于失败——先告诉他「没网」，而不是「加载失败」 */
  online?: boolean
  error?: { code?: number | string; message?: string } | null
  /** 已经拿到的数据条数。部分成功时它必须大于 0，否则那就是彻底失败 */
  loaded?: number
  /** 本次请求里失败的条数（批量场景） */
  failed?: number
  /** 数据的时间戳与「多久算过期」，两者都给才判过期 */
  fetchedAt?: number
  staleAfter?: number
  now?: number
}

export interface PageStateResult {
  kind: PageStateKind
  /** 为什么会这样。空状态之外的每一种都必须说得出原因 */
  reason: string
  /** 这一种状态下还能不能看见已有数据。部分成功与过期都能 */
  keepsContent: boolean
  /** 建议的恢复动作标识，由各端映射成按钮 */
  action: 'retry' | 'reload' | 'request-access' | 'go-online' | 'refresh' | null
}

const codeText = (code: number | string | undefined) => (code === undefined ? '' : `（${code}）`)

/**
 * 判定顺序是有意的：
 *   离线 → 无权限 → 部分成功 → 失败 → 加载中 → 空 → 过期 → 正常
 *
 * 离线排第一，因为其余每一种在断网时都会同时成立，而「没网」是唯一
 * 用户能处理的那条。部分成功排在失败前面，因为反过来会把已经成功的那批
 * 一并判成失败，界面上就会把它们清空——那是最难被发现、也最惹人恼火的一种错。
 */
export function pageState(input: PageStateInput): PageStateResult {
  const { loading = false, online = true, error = null, loaded = 0, failed = 0 } = input

  if (!online) {
    return { kind: 'offline', reason: '当前网络不可用', keepsContent: loaded > 0, action: 'go-online' }
  }

  const code = error?.code
  if (code === 403 || code === '403') {
    return { kind: 'forbidden', reason: error?.message || '当前账号没有这个资源的权限', keepsContent: false, action: 'request-access' }
  }

  if (failed > 0 && loaded > 0) {
    return {
      kind: 'partial',
      reason: `${loaded} 条成功，${failed} 条失败`,
      // 已经成功的那批必须留在屏幕上：重来一次的代价往往落在用户身上
      keepsContent: true,
      action: 'retry'
    }
  }

  if (error) {
    return { kind: 'failed', reason: `${error.message || '请求失败'}${codeText(code)}`, keepsContent: false, action: 'retry' }
  }

  if (loading) {
    return { kind: 'loading', reason: '正在加载', keepsContent: loaded > 0, action: null }
  }

  if (loaded === 0) {
    return { kind: 'empty', reason: '这里还没有内容', keepsContent: false, action: null }
  }

  const { fetchedAt, staleAfter, now = Date.now() } = input
  if (fetchedAt !== undefined && staleAfter !== undefined && now - fetchedAt > staleAfter) {
    return {
      kind: 'stale',
      reason: `数据是 ${Math.round((now - fetchedAt) / 60000)} 分钟前的`,
      keepsContent: true,
      action: 'refresh'
    }
  }

  return { kind: 'ready', reason: '', keepsContent: true, action: null }
}

/** 各端按这张表渲染动作按钮的文案，不各写一份 */
export const PAGE_STATE_ACTIONS: Record<NonNullable<PageStateResult['action']>, string> = {
  retry: '重试',
  reload: '重新加载',
  'request-access': '申请权限',
  'go-online': '重新连接',
  refresh: '刷新数据'
}
