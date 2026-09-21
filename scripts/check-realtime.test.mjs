/** 故障测试运行同一浏览器断言，每条变异必须击中指定断言。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

test('实时滑窗检查能拦截实际源码故障', () => {
  const result = spawnSync(process.execPath, ['scripts/check-realtime.mjs', '--faults'], {
    encoding: 'utf8',
    timeout: 300000,
    env: { ...process.env }
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  console.log(result.stdout)
})
