/**
 * 运行事件的传输适配层。
 *
 * 这一层的职责只有一件：把某个供应商的字节流翻译成 contracts/run 的事件，
 * 并且把「断了」「重连了」「取消了」这三件事处理干净。UI 不碰这里的任何细节。
 *
 * 三条最难在开发机上复现、却在线上天天发生的规则：
 *
 * - **取消之后晚到的片段不许续写**。取消是用户的明确意图，按下之后字还在冒，
 *   比不能取消更糟——他会以为停止按钮是假的。
 * - **同一个幂等键不重复执行**。重试、断线重连、用户手抖点两下都会让同一个
 *   请求发两遍；服务端幂等是前提，客户端也不该自己再触发一次。
 * - **断线恢复不重复 token**。恢复要带游标（最后一个收到的 seq），
 *   服务端从它之后接着发；不带游标的「重连」会把已经显示过的内容再念一遍。
 */
import type { RunEvent } from '../contracts/run'

export interface TransportRequest {
  /** 幂等键：同一个键在同一个适配器里只会真正发出一次 */
  idempotencyKey: string
  /** 恢复游标：断线重连时带上最后收到的 seq，从它之后接着要 */
  cursor?: number
  signal?: AbortSignal
}

export interface Transport {
  /** 订阅一次运行。返回的是异步事件流 */
  stream(request: TransportRequest): AsyncIterable<RunEvent>
}

export type Connection = 'idle' | 'connecting' | 'streaming' | 'reconnecting' | 'closed'

export interface RunnerOptions {
  transport: Transport
  /** 重连退避（毫秒）。用完之后不再重试，交由 UI 决定要不要手动重试 */
  backoff?: readonly number[]
  /** 注入等待，测试里可以让它立刻返回 */
  wait?: (ms: number) => Promise<void>
  onEvent: (event: RunEvent) => void
  onState?: (state: Connection) => void
  onError?: (error: unknown, attempt: number) => void
}

const DEFAULT_BACKOFF = [400, 1200, 3000] as const

/**
 * 驱动一次运行：连接、收流、断线重连、取消。
 *
 * 取消用 AbortController，不是一个布尔标记：标记只能拦住「下一次循环」，
 * 而流式响应可能正卡在一次读取上，标记翻了也没人看。
 */
export function createRunner(options: RunnerOptions) {
  const backoff = options.backoff ?? DEFAULT_BACKOFF
  const wait = options.wait ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const controller = new AbortController()

  let state: Connection = 'idle'
  let cursor = 0
  let cancelled = false
  let started = false

  const setState = (next: Connection) => {
    state = next
    options.onState?.(next)
  }

  async function run() {
    // 同一个 runner 只跑一次：重复调用不该悄悄开出第二条流
    if (started) return
    started = true

    for (let attempt = 0; ; attempt += 1) {
      if (cancelled) break
      setState(attempt === 0 ? 'connecting' : 'reconnecting')
      try {
        const stream = options.transport.stream({
          idempotencyKey: `run-${cursor === 0 ? 'start' : `resume-${cursor}`}`,
          cursor: cursor || undefined,
          signal: controller.signal
        })
        setState('streaming')
        for await (const event of stream) {
          // 取消之后到达的一律丢掉。reducer 那边也会再挡一次，
          // 但让它根本不进去更干净：日志里不会多出一串「已丢弃」
          if (cancelled) break
          // 恢复时服务端可能把游标那一条再发一遍，重复的 seq 不往下传
          if (event.seq <= cursor) continue
          cursor = event.seq
          options.onEvent(event)
        }
        setState('closed')
        return
      } catch (error) {
        if (cancelled) break
        options.onError?.(error, attempt)
        if (attempt >= backoff.length) {
          setState('closed')
          throw error
        }
        await wait(backoff[attempt])
      }
    }
    setState('closed')
  }

  return {
    run,
    get state() { return state },
    /** 已经收到的最后一个 seq，就是下次恢复要带的游标 */
    get cursor() { return cursor },
    cancel() {
      if (cancelled) return
      cancelled = true
      controller.abort()
      setState('closed')
    }
  }
}

/**
 * SSE 文本 → 事件。
 *
 * 按 `data:` 行切，空行分帧。分片边界不保证落在帧边界上，
 * 所以要留住半截帧等下一块——不留的话，丢的正好是最长的那几条消息。
 */
export function createSseDecoder() {
  let buffer = ''
  return {
    /** 喂一块文本，吐出这一块里完整的帧 */
    push(chunk: string): string[] {
      buffer += chunk
      const frames: string[] = []
      let index = buffer.indexOf('\n\n')
      while (index !== -1) {
        const frame = buffer.slice(0, index)
        buffer = buffer.slice(index + 2)
        const data = frame
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('\n')
        if (data && data !== '[DONE]') frames.push(data)
        index = buffer.indexOf('\n\n')
      }
      return frames
    },
    /** 流结束时缓冲区还剩东西，说明最后一帧没有以空行收尾 */
    get pending() { return buffer }
  }
}

/**
 * 用一串事件做成的 mock 传输：按脚本发，可注入断流。
 *
 * 断流不是「测试用的玩具」——它是这一层唯一要解决的问题，
 * 所以 mock 必须能造出来，否则重连那段代码永远没被跑过。
 */
export interface MockTransportOptions {
  events: readonly RunEvent[]
  /** 在第几条之后断开（1 基）。断开处会抛错，交给 runner 去重连 */
  dropAfter?: number
  /** 断开几次之后才让它顺利跑完 */
  dropTimes?: number
  wait?: (ms: number) => Promise<void>
}

export function createMockTransport(options: MockTransportOptions): Transport & { requests: TransportRequest[] } {
  const requests: TransportRequest[] = []
  let drops = 0
  const limit = options.dropTimes ?? 1

  return {
    requests,
    stream(request) {
      requests.push(request)
      const events = options.events
      return {
        async *[Symbol.asyncIterator]() {
          // 恢复游标：服务端从它之后接着发。不实现这一段的 mock
          // 测不出「重连之后内容念了两遍」这个最常见的症状
          const from = request.cursor ?? 0
          let sent = 0
          for (const event of events) {
            if (event.seq <= from) continue
            if (request.signal?.aborted) return
            sent += 1
            if (options.dropAfter && drops < limit && sent > options.dropAfter) {
              drops += 1
              throw new Error('连接断开')
            }
            yield event
          }
        }
      }
    }
  }
}
