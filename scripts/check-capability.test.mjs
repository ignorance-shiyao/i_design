/** 故障注入：能力声明这条检查真的会红吗。 */
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { checkCapability } from './check-capability.mjs'

const CONTRACT = 'packages/common/src/contracts/capability.ts'

/**
 * 整仓复制一份：这条检查要同时读声明与各端源码目录，
 * 只拷贝声明的话，「声明与实现对不上」根本无从判定。
 */
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-cap-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const dir of ['packages', 'src']) {
    cpSync(dir, join(root, dir), { recursive: true })
  }
  return root
}

function declare(root, entries) {
  const path = join(root, CONTRACT)
  const text = readFileSync(path, 'utf8')
  writeFileSync(
    path,
    text.replace(
      'export const capabilityExceptions: CapabilityException[] = []',
      `export const capabilityExceptions: CapabilityException[] = ${JSON.stringify(entries, null, 2)}`
    )
  )
}

test('当前仓库通过', async () => {
  assert.match(await checkCapability(), /能力声明检查通过/)
})

test('声明不支持、实现却还在时失败——过期的声明比没有声明更糟', async (t) => {
  const root = fixture(t)
  declare(root, [
    {
      component: 'IButton',
      end: 'react',
      reason: 'React 端这一版没有跟进按钮的加载态',
      fallback: '用 Spin 包一层按钮，自己控制禁用'
    }
  ])
  await assert.rejects(checkCapability(root), /确实存在/)
})

test('没写替代路径时失败', async (t) => {
  const root = fixture(t)
  declare(root, [
    { component: 'IButton', end: 'flutter', reason: 'Flutter 端没有等价的原生控件', fallback: '' }
  ])
  await assert.rejects(checkCapability(root), /没写替代路径/)
})

test('原因写成空话时失败', async (t) => {
  const root = fixture(t)
  declare(root, [
    { component: 'IButton', end: 'flutter', reason: '暂不支持', fallback: '改用 ITag 加点击区域承接同一操作' }
  ])
  await assert.rejects(checkCapability(root), /空话/)
})

test('组件在任何端都不存在时失败——这是删组件漏掉的陈旧声明', async (t) => {
  const root = fixture(t)
  declare(root, [
    {
      component: 'IGhostComponent',
      end: 'miniprogram',
      reason: '小程序没有等价的浮层容器，做不到跟随滚动',
      fallback: '改用页面内的固定区块承接同一信息'
    }
  ])
  await assert.rejects(checkCapability(root), /陈旧声明/)
})

test('同一个组件加同一个端声明两次时失败', async (t) => {
  const root = fixture(t)
  const one = {
    component: 'IButton',
    end: 'flutter',
    reason: 'Flutter 端没有等价的原生控件，做不到同样的按压反馈',
    fallback: '改用 ITag 加点击区域承接同一操作'
  }
  declare(root, [one, one])
  await assert.rejects(checkCapability(root), /被声明了两次/)
})

test('端名写错时失败', async (t) => {
  const root = fixture(t)
  declare(root, [
    {
      component: 'IButton',
      end: 'angular',
      reason: '这个端根本不在覆盖矩阵里，应该在这一步就被挡住',
      fallback: '没有替代路径，因为这个端不存在'
    }
  ])
  await assert.rejects(checkCapability(root), /不存在的端/)
})
