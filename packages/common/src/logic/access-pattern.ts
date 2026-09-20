/** B16 页面配方的内存模型；不构成身份认证或服务端授权。 */
export type AccessRole = 'admin' | 'manager' | 'member'
export type AccessSection = 'profile' | 'users' | 'roles' | 'organizations'
export type AccessPermission = 'directory' | 'contact' | 'manage'
export interface AccessUser {
  id: string; name: string; email: string; role: AccessRole; organizationId: string
  enabled: boolean; notifications: boolean; revision: number
}
export interface AccessOrganization { id: string; name: string; revision: number }
export interface AccessState { users: AccessUser[]; organizations: AccessOrganization[] }
export interface AccessSession { userId: string }
export const ACCESS_ROLES: Record<AccessRole, string> = { admin: '管理员', manager: '主管', member: '成员' }
export const ACCESS_SECTIONS: Record<AccessSection, string> = {
  profile: '个人设置', users: '用户管理', roles: '角色权限', organizations: '组织管理'
}
const GRANTS: Record<AccessRole, readonly AccessPermission[]> = {
  admin: ['directory', 'contact', 'manage'], manager: ['directory'], member: []
}
export class AccessError extends Error {
  constructor(public code: 401 | 403 | 404 | 409 | 422, message: string) { super(message); this.name = 'AccessError' }
}
export function accessActor(state: AccessState, session: AccessSession | null): AccessUser | undefined {
  return state.users.find(user => user.id === session?.userId && user.enabled)
}
export function accessCan(state: AccessState, session: AccessSession | null, permission: AccessPermission): boolean {
  const actor = accessActor(state, session)
  return !!actor && GRANTS[actor.role].includes(permission)
}
export function accessSections(state: AccessState, session: AccessSession | null): AccessSection[] {
  if (!accessActor(state, session)) return []
  return accessCan(state, session, 'directory') ? ['profile', 'users', 'roles', 'organizations'] : ['profile']
}
/** 直接从投影中去掉不可读字段；模板不接触通讯信息。 */
export function accessDirectory(state: AccessState, session: AccessSession | null) {
  if (!accessCan(state, session, 'directory')) return []
  return state.users.map(({ id, name, role, organizationId, enabled, email, revision }) => ({
    id, name, role, organizationId, enabled, revision,
    ...(accessCan(state, session, 'contact') ? { email } : {})
  }))
}
export function accessRolePermissions(role: AccessRole): readonly AccessPermission[] { return [...GRANTS[role]] }
export function accessLogin(state: AccessState, userId: string): AccessSession {
  if (!state.users.some(user => user.id === userId && user.enabled)) throw new AccessError(403, '该账号已停用或不存在')
  return { userId }
}
export type AccessCommand =
  | { kind: 'profile'; revision: number; name: string; notifications: boolean }
  | { kind: 'user'; id: string; revision: number; role: AccessRole; organizationId: string; enabled: boolean }
  | { kind: 'organization'; id: string; revision: number; name: string }
  | { kind: 'organization.create'; name: string }

function nameOf(value: string): string {
  const name = value.trim()
  if (!name || Array.from(name).length > 40) throw new AccessError(422, '名称需为 1 至 40 个字符')
  return name
}
function current(actual: number, expected: number) {
  if (actual !== expected) throw new AccessError(409, '内容已更新，请重新打开后再保存')
}
/** 每次写操作按当前快照重新授权，不相信打开表单时的角色或客户端按钮。 */
export function applyAccess(state: AccessState, session: AccessSession | null, command: AccessCommand): AccessState {
  const actor = accessActor(state, session)
  if (!actor) throw new AccessError(401, '请重新登录')
  if (command.kind === 'profile') {
    current(actor.revision, command.revision)
    const name = nameOf(command.name)
    if (typeof command.notifications !== 'boolean') throw new AccessError(422, '通知偏好无效')
    return { ...state, users: state.users.map(user => user.id === actor.id
      ? { ...user, name, notifications: command.notifications, revision: user.revision + 1 } : user) }
  }
  if (!accessCan(state, session, 'manage')) throw new AccessError(403, '仅管理员可以修改组织与用户权限')
  if (command.kind === 'user') {
    const target = state.users.find(user => user.id === command.id)
    if (!target) throw new AccessError(404, '用户不存在')
    current(target.revision, command.revision)
    if (!Object.prototype.hasOwnProperty.call(ACCESS_ROLES, command.role) || typeof command.enabled !== 'boolean') throw new AccessError(422, '角色或状态无效')
    if (!state.organizations.some(org => org.id === command.organizationId)) throw new AccessError(422, '请选择有效组织')
    if (target.role === 'admin' && target.enabled && (command.role !== 'admin' || !command.enabled)
      && !state.users.some(user => user.id !== target.id && user.enabled && user.role === 'admin')) {
      throw new AccessError(422, '至少保留一名启用的管理员')
    }
    return { ...state, users: state.users.map(user => user.id === target.id ? {
      ...user, role: command.role, organizationId: command.organizationId,
      enabled: command.enabled, revision: user.revision + 1
    } : user) }
  }
  const name = nameOf(command.name)
  if (state.organizations.some(org => org.name === name && (command.kind === 'organization.create' || org.id !== command.id))) {
    throw new AccessError(422, '组织名称已存在')
  }
  if (command.kind === 'organization.create') {
    let sequence = 1
    while (state.organizations.some(org => org.id === `org-${sequence}`)) sequence++
    return { ...state, organizations: [...state.organizations, { id: `org-${sequence}`, name, revision: 1 }] }
  }
  const target = state.organizations.find(org => org.id === command.id)
  if (!target) throw new AccessError(404, '组织不存在')
  current(target.revision, command.revision)
  return { ...state, organizations: state.organizations.map(org => org.id === target.id ? { ...org, name, revision: org.revision + 1 } : org) }
}
export function createAccessDemo(): AccessState {
  return {
    organizations: [{ id: 'product', name: '产品组', revision: 1 }, { id: 'service', name: '服务组', revision: 1 }],
    users: [
      { id: 'admin', name: '林青', email: 'lin@example.test', role: 'admin', organizationId: 'product', enabled: true, notifications: true, revision: 1 },
      { id: 'manager', name: '周宁', email: 'zhou@example.test', role: 'manager', organizationId: 'service', enabled: true, notifications: true, revision: 1 },
      { id: 'member', name: '许禾', email: 'xu@example.test', role: 'member', organizationId: 'product', enabled: true, notifications: false, revision: 1 },
      { id: 'disabled', name: '陈默', email: 'chen@example.test', role: 'member', organizationId: 'service', enabled: false, notifications: false, revision: 1 }
    ]
  }
}
