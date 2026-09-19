<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '@i-design/examples-shell/AppShell.vue'
import { IButton, IDetailPage, IEntityPicker, IFormPage, IInput, ITag, ITaskCenter, ITextarea } from '@i-design/vue-next'
import type { AsyncTaskItem, DetailActionSpec, EntityOption, IconName, SubmitPhase } from '@i-design/common'
import { createClock, people } from '@i-design/examples-shared'
import { applyOa, emptyOa, markOaRead, oaAmountCents, oaGate, OA_ACTION, OA_STATUS, OaError, type OaAction, type OaActor, type OaFields } from '../../../packages/common/src/logic/oa'

const staff = people(20260316)
const roles = [
  { ...staff[4], canApply: true, canReview: true, label: '申请人' },
  { ...staff[0], canApply: true, canReview: true, label: '审批人' },
  { ...staff[1], canApply: false, canReview: false, label: '只读观察员' }
]
const actorId = ref(roles[0].id)
const actor = computed(() => roles.find(p => p.id === actorId.value)!)
const name = (id: string) => staff.find(p => p.id === id)?.name ?? id
const clock = createClock()
const state = ref(emptyOa())
const view = ref('requests')
const selectedId = ref('')
const seenRevision = ref(0)
const editing = ref(false)
const editingId = ref('')
const phase = ref<SubmitPhase>('idle')
const error = ref('')
const success = ref('')
const title = ref('客户拜访差旅报销')
const amount = ref('1200.50')
const reason = ref('现场调研交通与住宿费用')
const chosen = ref<EntityOption[]>([])
const keyword = ref('')
const note = ref('')
let sequence = 0
let submitKey = ''
const initial = ref<Record<string, unknown>>({})
const values = computed(() => ({ title: title.value, amount: amount.value, reason: reason.value, reviewerId: chosen.value[0]?.id ?? '' }))
const current = computed(() => state.value.requests.find(r => r.id === selectedId.value))
const pending = computed(() => state.value.requests.filter(r => r.status === 'pending' && r.reviewerId === actor.value.id))
const listing = computed(() => view.value === 'inbox' ? pending.value : state.value.requests)
const nav = computed<{ key: string; label: string; icon: IconName }[]>(() => editing.value ? [] : [
  { key: 'requests', label: '申请记录', icon: 'file-text' },
  { key: 'inbox', label: `待我审批（${pending.value.length}）`, icon: 'check-circle' },
  { key: 'notices', label: '我的通知', icon: 'info-circle' }
])
const options = computed<EntityOption[]>(() => roles.filter(p => `${p.name}${p.label}`.includes(keyword.value)).map(p => ({
  id: p.id, label: p.name, hint: p.label,
  blockedReason: p.id === actor.value.id ? '不能审批自己的申请' : !p.canReview ? '没有审批权限' : undefined
})))
const actions: DetailActionSpec[] = [
  { key: 'approve', label: '同意申请', states: ['待审批'], kind: 'primary' },
  { key: 'return', label: '退回修改', states: ['待审批'] },
  { key: 'resubmit', label: '修改并重新提交', states: ['已退回'], kind: 'primary' }
]
const denied = computed(() => current.value ? Object.fromEntries((['approve', 'return', 'resubmit'] as const).map(action => [action, oaGate(current.value!, actor.value, action)]).filter(([, message]) => message)) : {})
const tasks = computed<AsyncTaskItem[]>(() => state.value.notices.filter(n => n.recipientId === actor.value.id).map(n => ({
  id: n.id, title: n.title, state: 'succeeded', createdAt: n.at, finishedAt: n.at, result: '审批动态已送达', seen: n.seen,
  target: { kind: '申请', id: n.requestId, label: n.requestId }
})))
function markRead(items: AsyncTaskItem[]) {
  state.value = markOaRead(state.value, actor.value.id, items.filter(t => t.seen).map(t => t.id))
}
function go(key: string) { view.value = key; selectedId.value = ''; error.value = ''; success.value = '' }
function open(id: string) {
  selectedId.value = id
  seenRevision.value = state.value.requests.find(r => r.id === id)?.revision ?? 0
  error.value = ''; success.value = ''; note.value = ''; view.value = 'detail'
}
function switchActor(id: string) { actorId.value = id; error.value = ''; success.value = ''; note.value = '' }
function startEdit(id = '') {
  const existing = state.value.requests.find(r => r.id === id)
  if (existing && oaGate(existing, actor.value, 'resubmit')) return
  editingId.value = id
  title.value = existing?.title ?? '客户拜访差旅报销'
  amount.value = ((existing?.amount ?? 120050) / 100).toFixed(2)
  reason.value = existing?.reason ?? '现场调研交通与住宿费用'
  const reviewer = roles.find(p => p.id === existing?.reviewerId) ?? roles.find(p => p.canReview && p.id !== actor.value.id)!
  chosen.value = [{ id: reviewer.id, label: reviewer.name }]
  initial.value = { ...values.value }
  submitKey = `submit-${++sequence}`
  phase.value = 'idle'; error.value = ''; success.value = ''; keyword.value = ''; editing.value = true
}
function resetForm() {
  title.value = String(initial.value.title); amount.value = String(initial.value.amount); reason.value = String(initial.value.reason)
  chosen.value = [{ id: String(initial.value.reviewerId), label: name(String(initial.value.reviewerId)) }]
  error.value = ''; phase.value = 'idle'
}
function showError(e: unknown) { error.value = e instanceof OaError ? `${e.code} · ${e.message}` : String(e) }
function submit() {
  phase.value = 'submitting'; error.value = ''
  const fields: OaFields = { title: title.value, amount: oaAmountCents(amount.value), reason: reason.value, reviewerId: chosen.value[0]?.id ?? '' }
  try {
    // 人员是否拥有审批资格来自当前人员目录，不由表单里传入的字符串决定。
    if (!roles.some(p => p.id === fields.reviewerId && p.canReview)) throw new OaError(422, '请选择有审批权限的人员')
    const result = applyOa(state.value, actor.value, editingId.value
      ? { action: 'resubmit', id: editingId.value, revision: seenRevision.value, key: submitKey, fields }
      : { action: 'submit', key: submitKey, fields }, clock.advance(60000))
    state.value = result.state; phase.value = 'succeeded'; editing.value = false
    open(result.id); success.value = '申请已提交，审批人已收到通知'
  } catch (e) { showError(e); phase.value = 'failed' }
}
function act(key: string) {
  if (!current.value) return
  if (key === 'resubmit') { startEdit(current.value.id); return }
  try {
    const result = applyOa(state.value, actor.value as OaActor, { action: key as OaAction, key: `${current.value.id}-${seenRevision.value}-${key}-${actor.value.id}`, id: current.value.id, revision: seenRevision.value, note: note.value }, clock.advance(60000))
    state.value = result.state; seenRevision.value = current.value.revision; error.value = ''; success.value = '处理完成，申请人已收到通知'; note.value = ''
  } catch (e) { showError(e) }
}
function simulateConflict() {
  if (!current.value) return
  try {
    const r = applyOa(state.value, actor.value, { action: 'return', key: `other-window-${++sequence}`, id: current.value.id, revision: current.value.revision, note: '另一窗口要求补充行程' }, clock.advance(60000))
    state.value = r.state
    success.value = '申请已在其他窗口处理，请刷新查看最新版本'
  } catch (e) { showError(e) }
}
const stamp = (at: number) => new Date(at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
</script>

<template>
  <AppShell app-id="oa" :nav="nav" :current="view" :user="`${actor.name}（${actor.label}）`" :crumbs="[{ label: 'OA 审批' }]" @navigate="go">
    <div class="oa">
      <section class="oa__roles" aria-label="示例身份">
        <span>当前身份</span>
        <IButton v-for="person in roles" :key="person.id" :variant="actorId === person.id ? 'primary' : 'secondary'" :aria-pressed="actorId === person.id" :disabled="editing" @click="switchActor(person.id)">{{ person.label }}</IButton>
        <p>本地演示数据，刷新后重置。切换身份可走完申请与审批流程。</p>
      </section>
      <p v-if="error" class="oa__error" role="alert">{{ error }}</p>
      <p v-if="success" class="oa__success" role="status">{{ success }}</p>

      <IFormPage v-if="editing" :model-value="values" :initial="initial" :phase="phase" :valid="true" :title="editingId ? `修改申请 ${editingId}` : '新建报销申请'" @submit="submit" @reset="resetForm" @cancel="editing = false">
        <div class="oa__form">
          <label>申请标题<IInput v-model="title" maxlength="80" /></label>
          <label>报销金额（元）<IInput v-model="amount" inputmode="decimal" /></label>
          <label>用途说明<ITextarea v-model="reason" :maxlength="500" aria-label="用途说明" /></label>
          <section aria-label="选择审批人"><h2>审批人</h2><IEntityPicker v-model="chosen" v-model:keyword="keyword" :page="options" unit="人" /></section>
        </div>
      </IFormPage>

      <ITaskCenter v-else-if="view === 'notices'" :tasks="tasks" title="我的审批通知" :format-time="stamp" @update:tasks="markRead" @open="target => open(target.id)" />

      <IDetailPage v-else-if="current" :title="`${current.id} · ${current.title}`" :status="OA_STATUS[current.status]" :status-tone="current.status === 'approved' ? 'success' : current.status === 'returned' ? 'warning' : 'brand'" :summary="`申请人：${name(current.ownerId)} · 审批人：${name(current.reviewerId)} · 金额 ¥${(current.amount / 100).toFixed(2)} · 版本 v${current.revision}`" :actions="actions" :denied="denied" :seen-revision="seenRevision" :current-revision="current.revision" @action="act" @refresh="seenRevision = current.revision" @back="go('requests')">
        <div class="oa__detail">
          <section><h2>用途说明</h2><p class="oa__reason">{{ current.reason }}</p></section>
          <label v-if="current.status === 'pending' && !denied.approve">审批意见（退回时必填）<ITextarea v-model="note" :maxlength="500" aria-label="审批意见（退回时必填）" /></label>
          <IButton v-if="current.status === 'pending' && !denied.approve" @click="simulateConflict">模拟其他窗口退回</IButton>
          <section><h2>流转记录</h2><ol class="oa__history"><li v-for="item in current.history" :key="item.revision"><strong>{{ OA_ACTION[item.action] }}</strong><span>{{ name(item.actorId) }} · {{ stamp(item.at) }} · v{{ item.revision }}</span><p v-if="item.note">{{ item.note }}</p></li></ol></section>
        </div>
      </IDetailPage>

      <section v-else class="oa__list" aria-label="申请列表">
        <header><h1>{{ view === 'inbox' ? '待我审批' : '申请记录' }}</h1><IButton :disabled="!actor.canApply" variant="primary" @click="startEdit()">新建申请</IButton></header>
        <p v-if="!actor.canApply">当前身份只读，可以查看申请与流转记录。</p>
        <p v-if="!listing.length" class="oa__empty">{{ view === 'inbox' ? '暂时没有待你处理的申请' : '还没有申请，创建一张报销单开始流程' }}</p>
        <ul v-else class="oa__cards"><li v-for="request in listing" :key="request.id"><div class="oa__card-head"><h2>{{ request.title }}</h2><ITag :type="request.status === 'approved' ? 'success' : request.status === 'returned' ? 'warning' : 'brand'">{{ OA_STATUS[request.status] }}</ITag></div><p>{{ request.id }} · {{ name(request.ownerId) }} · ¥{{ (request.amount / 100).toFixed(2) }}</p><p>{{ request.reason }}</p><IButton @click="open(request.id)">查看 {{ request.id }}</IButton></li></ul>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.oa { display: grid; gap: var(--i-spacing-4); padding: var(--i-spacing-4); min-width: 0; }
.oa :deep(.i-task-center__name > span), .oa :deep(.i-task-center__detail) { max-width: 45em; overflow-wrap: anywhere; }
.oa p { max-width: 45em; overflow-wrap: anywhere; margin: 0; }
.oa h1, .oa h2 { overflow-wrap: anywhere; min-width: 0; }
.oa h1 { font-size: var(--i-font-size-xl); margin: 0; }
.oa h2 { font-size: var(--i-font-size-md); margin: 0; }
.oa__roles { display: flex; flex-wrap: wrap; align-items: center; gap: var(--i-spacing-2); padding: var(--i-spacing-3); background: var(--i-color-bg-subtle); border-radius: var(--i-radius-lg); }
.oa__roles p { flex-basis: 100%; color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.oa__error { color: var(--i-color-danger-text); }
.oa__success { color: var(--i-color-success-text); }
.oa__form, .oa__detail { display: grid; gap: var(--i-spacing-4); max-width: 45em; min-width: 0; }
.oa label, .oa__detail section { display: grid; gap: var(--i-spacing-2); }
.oa__list { display: grid; gap: var(--i-spacing-4); }
.oa__list header, .oa__card-head { display: flex; flex-wrap: wrap; gap: var(--i-spacing-3); justify-content: space-between; align-items: center; }
.oa__cards { columns: 22em; column-gap: var(--i-spacing-4); list-style: none; margin: 0; padding: 0; }
.oa__cards > li { break-inside: avoid; display: grid; gap: var(--i-spacing-3); margin-bottom: var(--i-spacing-4); padding: var(--i-spacing-4); background: var(--i-color-bg-elevated); border: 1px solid var(--i-color-hairline); border-radius: var(--i-radius-lg); }
.oa__history { display: grid; gap: var(--i-spacing-3); padding-left: var(--i-spacing-5); margin: 0; }
.oa__history li > span { display: block; color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.oa__empty { padding-block: var(--i-spacing-6); color: var(--i-color-text-secondary); }
</style>
