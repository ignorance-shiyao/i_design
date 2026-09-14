/**
 * 脱敏与 traceId 的回归测试。
 *
 * 泄漏这件事不会有人报警——它只是安静地躺在日志系统里，
 * 所以只能靠测试把每一种「不该出现在日志里的东西」钉住。
 */
import { describe, expect, it } from 'vitest'
import { createTelemetry, redact, redactText, type LogRecord } from './observability'

function collect() {
  const records: LogRecord[] = []
  const telemetry = createTelemetry({
    adapter: { write: (record) => records.push(record) },
    now: () => 1_700_000_000_000
  })
  return { records, telemetry }
}

describe('脱敏', () => {
  it('常见的机密形状都被盖掉', () => {
    expect(redactText('key=sk-abcdefgh12345678')).toBe('key=[密钥]')
    expect(redactText('Authorization: Bearer abc.def-ghi_jkl')).toContain('Bearer [密钥]')
    expect(redactText('token eyJhbGciOiJIUzI1NiJ9')).toBe('token [令牌]')
    expect(redactText('联系 shiyao@example.com')).toBe('联系 [邮箱]')
    expect(redactText('手机 13800138000')).toBe('手机 [手机号]')
  })

  it('allow 清单之外的字段一律丢弃——默认什么都不带', () => {
    const out = redact({ runId: 'r1', prompt: '用户写的一整段话', file: 'a.pdf' }, ['runId'])
    expect(out).toEqual({ runId: 'r1' })
  })

  it('长文本截断：日志里留半页提示词没有排查价值，却足以泄漏内容', () => {
    const out = redact({ reason: '很长'.repeat(200) }, ['reason'], 20)
    expect(String(out.reason)).toHaveLength(20 + '…（已截断）'.length)
  })

  it('数组只记长度，对象只记形状', () => {
    expect(redact({ count: 3, seq: [1, 2, 3], model: { name: 'x' } }, ['count', 'seq', 'model']))
      .toEqual({ count: 3, seq: '[3 项]', model: '[对象]' })
  })
})

describe('traceId', () => {
  it('同一条 trace 上的请求、事件与错误共用一个 id', () => {
    const { records, telemetry } = collect()
    const trace = telemetry.startTrace('api.request', { runId: 'r1' })
    trace.info('run.started', { runId: 'r1' })
    trace.error('run.failed', new Error('上游 500'), { code: 500 })
    expect(new Set(records.map((r) => r.traceId)).size).toBe(1)
    expect(records.map((r) => r.event)).toEqual(['api.request', 'run.started', 'run.failed'])
    expect(records[2].severity).toBe('error')
    expect(records[2].data.code).toBe(500)
  })

  it('两条 trace 互不相同，并发的相同请求也分得开', () => {
    const { telemetry } = collect()
    expect(telemetry.startTrace('a').traceId).not.toBe(telemetry.startTrace('a').traceId)
  })

  it('异常原文里的机密也会被盖掉——整段带上是最常见的泄漏路径', () => {
    const { records, telemetry } = collect()
    telemetry.startTrace('api.request').error('api.failed', new Error('调用失败：Bearer abc.def-ghi_jkl 无效'))
    expect(String(records[1].data.message)).toContain('Bearer [密钥]')
    expect(String(records[1].data.message)).not.toContain('abc.def-ghi_jkl')
  })

  it('默认不带用户输入：提示词与文件名进不了日志', () => {
    const { records, telemetry } = collect()
    telemetry.startTrace('run.submit', { prompt: '帮我写一封辞职信', fileName: '工资表.xlsx', runId: 'r9' })
    expect(records[0].data).toEqual({ runId: 'r9' })
  })
})
