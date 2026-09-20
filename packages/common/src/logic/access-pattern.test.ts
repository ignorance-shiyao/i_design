import { describe, expect, it } from 'vitest'
import { accessActor, accessCan, accessDirectory, accessLogin, accessSections, applyAccess, createAccessDemo, type AccessCommand, type AccessRole } from './access-pattern'

describe('B16 登录与授权页面模式', () => {
  it('匿名、停用与不存在的账号不能进入工作区', () => {
    const state = createAccessDemo()
    expect(accessSections(state, null)).toEqual([])
    for (const id of ['disabled', 'missing']) expect(() => accessLogin(state, id)).toThrow('已停用或不存在')
    expect(() => applyAccess(state, null, { kind: 'organization.create', name: '测试组' })).toThrow('请重新登录')
  })
  it('角色同时约束菜单、字段与动作，主管投影没有 email 属性', () => {
    const state = createAccessDemo()
    for (const [userId, sections, manage, contact] of [
      ['admin', 4, true, true], ['manager', 4, false, false], ['member', 1, false, false]
    ] as const) {
      const session = accessLogin(state, userId)
      expect(accessSections(state, session)).toHaveLength(sections)
      expect(accessCan(state, session, 'manage')).toBe(manage)
      for (const row of accessDirectory(state, session)) expect('email' in row).toBe(contact)
    }
    expect(accessDirectory(state, { userId: 'member' })).toEqual([])
  })
  it('越过界面直接提交也不能提权，失败不改原快照', () => {
    const state = createAccessDemo(), before = JSON.stringify(state)
    const commands: AccessCommand[] = [
      { kind: 'user', id: 'member', revision: 1, role: 'admin', organizationId: 'product', enabled: true },
      { kind: 'organization', id: 'product', revision: 1, name: '改名' },
      { kind: 'organization.create', name: '新组' }
    ]
    for (const userId of ['member', 'manager']) for (const command of commands) {
      expect(() => applyAccess(state, { userId }, command)).toThrow('仅管理员')
    }
    expect(JSON.stringify(state)).toBe(before)
  })
  it('个人设置只改本人白名单字段，拒绝空名与失效版本', () => {
    const state = createAccessDemo()
    const command = { kind: 'profile', revision: 1, name: '新名称', notifications: true, role: 'admin', id: 'admin' } as const
    const next = applyAccess(state, { userId: 'member' }, command)
    expect(next.users[2]).toMatchObject({ id: 'member', role: 'member', name: '新名称', revision: 2 })
    expect(next.users[0]).toEqual(state.users[0])
    expect(() => applyAccess(next, { userId: 'member' }, command)).toThrow('内容已更新')
    expect(() => applyAccess(state, { userId: 'member' }, { ...command, name: '  ' })).toThrow('1 至 40')
  })
  it('管理员变更角色和组织后，已有会话立即反映权限变化；停用则失效', () => {
    const state = createAccessDemo(), session = { userId: 'manager' }
    const next = applyAccess(state, { userId: 'admin' }, { kind: 'user', id: 'manager', revision: 1, role: 'member', organizationId: 'product', enabled: true })
    expect(accessSections(next, session)).toEqual(['profile'])
    expect(accessDirectory(next, session)).toEqual([])
    const disabled = applyAccess(next, { userId: 'admin' }, { kind: 'user', id: 'manager', revision: 2, role: 'member', organizationId: 'product', enabled: false })
    expect(accessActor(disabled, session)).toBeUndefined()
    expect(() => applyAccess(disabled, session, { kind: 'profile', revision: 3, name: '尝试保存', notifications: true })).toThrow('请重新登录')
  })
  it('最后一名启用的管理员不能被停用或降权，存在另一名时允许', () => {
    const state = createAccessDemo(), session = { userId: 'admin' }
    for (const role of ['admin', 'manager', 'member'] as AccessRole[]) for (const enabled of [true, false]) {
      const command: AccessCommand = { kind: 'user', id: 'admin', revision: 1, role, enabled, organizationId: 'product' }
      if (role === 'admin' && enabled) expect(applyAccess(state, session, command).users[0].revision).toBe(2)
      else expect(() => applyAccess(state, session, command)).toThrow('至少保留')
    }
    const two = applyAccess(state, session, { kind: 'user', id: 'member', revision: 1, role: 'admin', organizationId: 'product', enabled: true })
    const next = applyAccess(two, session, { kind: 'user', id: 'admin', revision: 1, role: 'member', organizationId: 'product', enabled: true })
    expect(accessCan(next, session, 'manage')).toBe(false)
  })
  it('用户变更拒绝不存在的组织、无效角色和陈旧版本', () => {
    const state = createAccessDemo(), session = { userId: 'admin' }
    const command = { kind: 'user', id: 'member', revision: 1, role: 'member', organizationId: 'product', enabled: true } as const
    expect(() => applyAccess(state, session, { ...command, organizationId: 'missing' })).toThrow('有效组织')
    expect(() => applyAccess(state, session, { ...command, role: 'superuser' as AccessRole })).toThrow('角色或状态无效')
    expect(() => applyAccess(state, session, { ...command, revision: 0 })).toThrow('内容已更新')
  })
  it('组织创建与改名保留关联，拒绝重名与版本冲突', () => {
    const state = createAccessDemo(), session = { userId: 'admin' }
    const next = applyAccess(state, session, { kind: 'organization.create', name: ' 支持组 ' })
    const org = next.organizations[2]
    expect(org.name).toBe('支持组')
    expect(() => applyAccess(next, session, { kind: 'organization.create', name: '支持组' })).toThrow('已存在')
    const renamed = applyAccess(next, session, { kind: 'organization', id: 'product', revision: 1, name: '研发组' })
    expect(renamed.users).toEqual(next.users)
    expect(renamed.organizations[0].name).toBe('研发组')
    expect(() => applyAccess(renamed, session, { kind: 'organization', id: 'product', revision: 1, name: '再改名' })).toThrow('内容已更新')
  })
})
