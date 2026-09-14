/**
 * 可观测性适配器与脱敏。
 *
 * 两件事要同时成立，而它们互相拉扯：
 *   ① 线上出问题时，一条错误要能被追回到具体那次请求——所以要有 traceId，
 *      并且它要贯穿请求、事件与错误；
 *   ② 日志不许带走用户的东西——提示词、上传的文件内容、令牌、邮箱、手机号。
 *      这类泄漏不会有人报警，它只是安静地躺在日志系统里，直到有人翻出来。
 *
 * 所以默认是「什么都不带」：要带的字段必须显式列出来（allow 清单），
 * 而不是「除了这几个都带」（deny 清单）。deny 清单永远漏，
 * 因为下一个字段是下个月才加的，没人会回来补。
 */

export type Severity = 'debug' | 'info' | 'warn' | 'error'

export interface LogRecord {
  severity: Severity
  /** 事件名，如 run.failed、api.request */
  event: string
  traceId: string
  at: number
  /** 已经脱敏的附加字段 */
  data: Record<string, unknown>
}

export interface LoggerAdapter {
  write(record: LogRecord): void
}

/** 默认落到控制台。不上传任何东西——要上传由使用方注入自己的适配器 */
export const consoleAdapter: LoggerAdapter = {
  write(record) {
    const line = `[${record.severity}] ${record.event} trace=${record.traceId}`
    if (record.severity === 'error') console.error(line, record.data)
    else console.warn(line, record.data)
  }
}

/*
 * 这些形状一旦出现在字符串里就要盖掉，不管它在哪个字段上。
 * allow 清单管的是「哪些字段能带」，这一层管的是「带出去的内容里混进了不该有的东西」——
 * 比如把整段报错原文当 message 带上，而原文里恰好印着一个 token。
 */
const SECRET_PATTERNS: readonly [RegExp, string][] = [
  [/\b(sk|pk|rk)-[A-Za-z0-9_-]{8,}/g, '[密钥]'],
  [/\bBearer\s+[A-Za-z0-9._-]{8,}/gi, 'Bearer [密钥]'],
  [/\beyJ[A-Za-z0-9._-]{10,}/g, '[令牌]'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[邮箱]'],
  [/\b1[3-9]\d{9}\b/g, '[手机号]'],
  [/\b\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g, '[身份证]']
]

/** 把字符串里疑似机密的部分盖掉 */
export function redactText(text: string): string {
  return SECRET_PATTERNS.reduce((out, [pattern, mask]) => out.replace(pattern, mask), text)
}

/**
 * 按 allow 清单挑字段，并对留下来的做一次形状脱敏。
 *
 * 长文本一律截断：日志里留半页提示词没有排查价值，却足以泄漏内容。
 */
export function redact(
  data: Record<string, unknown>,
  allow: readonly string[],
  maxLength = 200
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of allow) {
    if (!(key in data)) continue
    const value = data[key]
    if (typeof value === 'string') {
      const masked = redactText(value)
      out[key] = masked.length > maxLength ? `${masked.slice(0, maxLength)}…（已截断）` : masked
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      out[key] = value
    } else if (Array.isArray(value)) {
      // 数组只记长度：内容多半是消息或文件列表，正是不该带走的那类
      out[key] = `[${value.length} 项]`
    } else if (value !== undefined) {
      out[key] = '[对象]'
    }
  }
  return out
}

export interface TelemetryOptions {
  adapter?: LoggerAdapter
  /** 允许带上的字段名。不在清单里的一律丢弃 */
  allow?: readonly string[]
  now?: () => number
  /** 生成 traceId；默认是递增序号，测试与截图才不会每次不同 */
  traceId?: () => string
}

/** 默认放行的字段：全是标识与量级，没有一个是用户写的内容 */
export const DEFAULT_ALLOW = [
  'runId', 'conversationId', 'toolCallId', 'approvalId', 'artifactId',
  'status', 'code', 'attempt', 'durationMs', 'count', 'seq', 'reason', 'model', 'version'
] as const

export function createTelemetry(options: TelemetryOptions = {}) {
  const adapter = options.adapter ?? consoleAdapter
  const allow = options.allow ?? DEFAULT_ALLOW
  const now = options.now ?? (() => Date.now())
  let counter = 0
  const nextTrace = options.traceId ?? (() => `t-${(counter += 1).toString(36).padStart(4, '0')}`)

  return {
    /**
     * 开一条 trace：同一次用户动作里的请求、事件与错误共用它。
     * 没有它的话，「这条报错是哪次点击引起的」只能靠时间戳猜，
     * 而并发两次相同请求时时间戳也分不开。
     */
    startTrace(event: string, data: Record<string, unknown> = {}) {
      const traceId = nextTrace()
      const write = (severity: Severity, name: string, extra: Record<string, unknown> = {}) => {
        adapter.write({ severity, event: name, traceId, at: now(), data: redact(extra, allow) })
      }
      write('info', event, data)
      return {
        traceId,
        info: (name: string, extra?: Record<string, unknown>) => write('info', name, extra),
        warn: (name: string, extra?: Record<string, unknown>) => write('warn', name, extra),
        /**
         * 错误只带错误码与一句已脱敏的摘要。
         * 把异常原文整段带上是最常见的泄漏路径——原文里常常印着请求体。
         */
        error: (name: string, error: unknown, extra?: Record<string, unknown>) => {
          const message = error instanceof Error ? error.message : String(error)
          adapter.write({
            severity: 'error',
            event: name,
            traceId,
            at: now(),
            data: { ...redact(extra ?? {}, allow), message: redactText(message).slice(0, 200) }
          })
        }
      }
    }
  }
}

export type Trace = ReturnType<ReturnType<typeof createTelemetry>['startTrace']>
