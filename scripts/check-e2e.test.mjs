/** 修改浏览器实际收到的构建代码，证明业务结果检查真的判红；不改工作树。 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { checkE2E } from './check-e2e.mjs'

for (const fault of [
  { name: 'OA 页面横向撑宽', only: 'oa', from: 'recipientId:', to: 'recipientId:', append: ';document.body.style.minWidth="1800px";', expected: /横向溢出/ },
  { name: 'OA 通知丢失收件人', only: 'oa', from: 'recipientId:', to: 'lostRecipientId:', expected: /OA 通知必须送达审批人/ },
  { name: 'ERP 新建订单错落终态', only: 'erp', from: 'status:"draft"', to: 'status:"closed"', expected: /已提交/ },
  { name: 'Agent 丢失产物事件', only: 'agent-成功-正常', from: 'type:"artifact.emitted"', to: 'type:"artifact.lost"', expected: /i-artifact-workspace__preview/ }
]) {
  test(fault.name, { timeout: 120000 }, async () => {
    let replacements = 0
    await assert.rejects(checkE2E({
      only: fault.only,
      mutate(source) {
        if (!source.includes(fault.from)) return source
        replacements += 1
        return source.replaceAll(fault.from, fault.to) + (fault.append ?? '')
      }
    }), fault.expected)
    assert.ok(replacements > 0, '故障没有注入到真实构建代码，不算验证')
  })
}
