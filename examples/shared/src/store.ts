/**
 * 版本化的本地存储。
 *
 * 示例应用要能刷新恢复，也要能一键重置。这两件事都容易做错：
 *
 * - **恢复**时读到的可能是上一版 schema 写的数据。直接用会在某个字段上
 *   炸得莫名其妙，所以要么迁移，要么明确丢弃并说明。
 * - **旧版代码读到更新的 schema** 时绝不能静默覆盖：使用方可能刚在新版里
 *   填了一半的数据，被旧版一写就没了。这里的做法是拒绝读取并报明原因，
 *   由调用方决定是重置还是提示升级。
 * - **重置**要连键一起删干净，否则「重置」之后还剩半份旧数据，
 *   比不重置更难查。
 */
export interface StoredEnvelope<T> {
  version: number
  data: T
}

export type LoadResult<T> =
  | { status: 'empty' }
  | { status: 'ok'; data: T; migratedFrom?: number }
  | { status: 'too-new'; found: number; expected: number }
  | { status: 'broken'; reason: string }

export interface StoreOptions<T> {
  key: string
  version: number
  /** 把旧版本的数据搬到当前版本；返回 null 表示这一版没法迁移，按丢弃处理 */
  migrate?: (data: unknown, from: number) => T | null
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
}

/** 没有 localStorage（SSR、隐私模式）时的兜底：内存里存，行为一致 */
export function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value) },
    removeItem: (key) => { map.delete(key) }
  }
}

export function createStore<T>(options: StoreOptions<T>) {
  const storage = options.storage
    ?? (typeof localStorage === 'undefined' ? memoryStorage() : localStorage)

  return {
    key: options.key,

    load(): LoadResult<T> {
      const raw = storage.getItem(options.key)
      if (raw === null) return { status: 'empty' }
      let parsed: StoredEnvelope<unknown>
      try {
        parsed = JSON.parse(raw)
      } catch {
        return { status: 'broken', reason: '不是合法的 JSON' }
      }
      if (typeof parsed !== 'object' || parsed === null || typeof parsed.version !== 'number') {
        return { status: 'broken', reason: '缺少版本号' }
      }
      if (parsed.version > options.version) {
        // 不覆盖：新版写的数据在旧版眼里是看不懂的，静默覆盖等于替用户删数据
        return { status: 'too-new', found: parsed.version, expected: options.version }
      }
      if (parsed.version < options.version) {
        const migrated = options.migrate?.(parsed.data, parsed.version) ?? null
        if (migrated === null) return { status: 'broken', reason: `没有从 v${parsed.version} 到 v${options.version} 的迁移` }
        return { status: 'ok', data: migrated, migratedFrom: parsed.version }
      }
      return { status: 'ok', data: parsed.data as T }
    },

    save(data: T): void {
      storage.setItem(options.key, JSON.stringify({ version: options.version, data } satisfies StoredEnvelope<T>))
    },

    reset(): void {
      storage.removeItem(options.key)
    }
  }
}
