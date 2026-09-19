/** OA 示例的共享事务模型。只计算下一份快照，不读时钟、不写存储、不依赖 UI。 */
export type OaStatus = 'pending' | 'returned' | 'approved'
export type OaAction = 'approve' | 'return' | 'resubmit'
export interface OaActor { id: string; canApply: boolean; canReview: boolean }
export interface OaFields { title: string; amount: number; reason: string; reviewerId: string }
export interface OaHistory { action: 'submit' | OaAction; actorId: string; at: number; note: string; revision: number }
export interface OaRequest extends OaFields { id: string; ownerId: string; status: OaStatus; revision: number; history: OaHistory[] }
export interface OaNotice { id: string; requestId: string; recipientId: string; title: string; at: number; seen: boolean }
export interface OaState { requests: OaRequest[]; notices: OaNotice[]; receipts: Record<string, { fingerprint: string; id: string }> }
export type OaCommand =
  | { action: 'submit'; key: string; fields: OaFields }
  | { action: OaAction; key: string; id: string; revision: number; fields?: OaFields; note?: string }
export class OaError extends Error {
  constructor(public code: 403 | 404 | 409 | 422, message: string) { super(message); this.name = 'OaError' }
}
export const emptyOa = (): OaState => ({ requests: [], notices: [], receipts: {} })
export const OA_STATUS: Record<OaStatus, string> = { pending: '待审批', returned: '已退回', approved: '已通过' }
export const OA_ACTION: Record<OaHistory['action'], string> = { submit: '提交申请', approve: '审批通过', return: '退回修改', resubmit: '重新提交' }
export function oaAmountCents(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return NaN
  const [yuan, fraction = ''] = value.trim().split('.')
  return Number(yuan) * 100 + Number(fraction.padEnd(2, '0'))
}
/** 状态决定动作是否存在；权限决定动作是否可以执行。界面和事务提交共用。 */
export function oaGate(request: OaRequest, actor: OaActor, action: OaAction): string {
  if (action === 'resubmit') {
    if (request.status !== 'returned') return '只有退回的申请可以重新提交'
    if (request.ownerId !== actor.id || !actor.canApply) return '只有申请人可以修改并重新提交'
  } else {
    if (request.status !== 'pending') return '申请已处理，请刷新查看结果'
    if (request.ownerId === actor.id) return '不能审批自己提交的申请'
    if (!actor.canReview || request.reviewerId !== actor.id) return '只有指定审批人可以处理'
  }
  return ''
}
function validate(fields: OaFields, ownerId: string) {
  if (!fields.title.trim() || !fields.reason.trim()) throw new OaError(422, '请填写申请标题和用途说明')
  if (fields.title.length > 80 || fields.reason.length > 500) throw new OaError(422, '标题最多 80 字，用途说明最多 500 字')
  if (!Number.isSafeInteger(fields.amount) || fields.amount <= 0) throw new OaError(422, '金额须大于 0，最多两位小数')
  if (!fields.reviewerId || fields.reviewerId === ownerId) throw new OaError(422, '请选择其他人员审批，不能审批自己的申请')
}
function cleanFields(fields: OaFields): OaFields {
  return { title: fields.title.trim(), amount: fields.amount, reason: fields.reason.trim(), reviewerId: fields.reviewerId }
}
export function applyOa(state: OaState, actor: OaActor, command: OaCommand, at: number): { state: OaState; id: string; duplicate: boolean } {
  if (!command.key.trim()) throw new OaError(422, '请求标识不能为空')
  const receiptKey = JSON.stringify([actor.id, command.key])
  const fingerprint = JSON.stringify(command)
  const receipt = Object.prototype.hasOwnProperty.call(state.receipts, receiptKey) ? state.receipts[receiptKey] : undefined
  if (receipt) {
    if (receipt.fingerprint !== fingerprint) throw new OaError(409, '同一请求标识不能用于不同内容')
    return { state, id: receipt.id, duplicate: true }
  }
  let request: OaRequest
  let note = ''
  if (command.action === 'submit') {
    if (!actor.canApply) throw new OaError(403, '当前身份没有提交申请权限')
    validate(command.fields, actor.id)
    request = { ...cleanFields(command.fields), id: `OA-${String(state.requests.length + 1).padStart(4, '0')}`, ownerId: actor.id, status: 'pending', revision: 1, history: [] }
  } else {
    const existing = state.requests.find(r => r.id === command.id)
    if (!existing) throw new OaError(404, '申请不存在')
    const denied = oaGate(existing, actor, command.action)
    if (denied) throw new OaError(403, denied)
    if (existing.revision !== command.revision) throw new OaError(409, '申请版本已变化，请刷新后重试')
    note = command.note?.trim() ?? ''
    if (note.length > 500) throw new OaError(422, '审批意见最多 500 字')
    if (command.action === 'return' && !note) throw new OaError(422, '退回时必须填写修改原因')
    if (command.action === 'resubmit') {
      if (!command.fields) throw new OaError(422, '缺少修改后的申请内容')
      validate(command.fields, existing.ownerId)
    }
    request = { ...existing, ...(command.action === 'resubmit' ? cleanFields(command.fields!) : {}), status: command.action === 'return' ? 'returned' : command.action === 'approve' ? 'approved' : 'pending', revision: existing.revision + 1 }
  }
  request = { ...request, history: [...request.history, { action: command.action, actorId: actor.id, at, note, revision: request.revision }] }
  const notice: OaNotice = {
    id: `${request.id}-v${request.revision}`, requestId: request.id,
    recipientId: request.status === 'pending' ? request.reviewerId : request.ownerId,
    title: `${request.id} · ${request.title} · ${OA_STATUS[request.status]}${note ? `：${note}` : ''}`, at, seen: false
  }
  return { id: request.id, duplicate: false, state: {
    requests: [...state.requests.filter(r => r.id !== request.id), request],
    notices: [...state.notices, notice],
    receipts: { ...state.receipts, [receiptKey]: { fingerprint, id: request.id } }
  } }
}
export function markOaRead(state: OaState, actorId: string, ids: readonly string[]): OaState {
  return { ...state, notices: state.notices.map(n => n.recipientId === actorId && ids.includes(n.id) ? { ...n, seen: true } : n) }
}
