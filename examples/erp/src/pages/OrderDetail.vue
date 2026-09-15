<script setup lang="ts">
/**
 * 订单详情与状态流转。
 *
 * 这一页现在是 IDetailPage（B12）的宿主，只负责把业务规则翻译成它认识的三样
 * 东西：**状态**（决定哪些动作根本不出现）、**权限**（决定哪些出现但是灰的）、
 * **版本**（决定这一份还作不作数）。动作该不该出现、灰按钮写什么话、
 * 失效提示排在哪儿，全在 logic/detail.ts 里判，示例不再自己写一遍。
 *
 * 三条真实分支仍然是这一页要演的东西：
 *
 * - **403：不能审批自己提交的单据。** 它既不是状态问题也不是权限问题——
 *   这个人确实有审批角色，只是不能审自己的。这类规则写不进状态机也写不进
 *   权限表，所以走 denied：按钮出现、是灰的、旁边写着为什么。
 *   后端那份规则会在任何情况下挡住，前端这道只是不让人点下去才发现。
 * - **409：详情页停留期间别人改过。** 带着进页面时拿到的 revision 提交；
 *   而在提交之前，版本对不上就已经由 IDetailPage 说出来了（「你看到的是 v3，
 *   现在已经是 v5」），写动作全部停用——不必等服务端退一个 409 回来。
 * - **状态机拒绝**：草稿不能直接变成已发货，所以那个动作在草稿态下不出现。
 */
import { computed, ref } from 'vue'
import { IDetailPage } from '@i-design/vue-next'
import { ApiError, ORDER_TRANSITIONS, type OrderStatus } from '@i-design/examples-shared'
import type { DetailActionSpec } from '@i-design/common'
import { STATUS_LABEL, STATUS_TONE, api, money, personName, session } from '../data'

const props = defineProps<{ id: string; siblingIds?: string[]; returnTicket?: string }>()
const emit = defineEmits<{ back: []; open: [id: string] }>()

const error = ref('')
const notice = ref('')
const version = ref(0)

const order = computed(() => {
  version.value
  try {
    return api.getOrder(props.id).order
  } catch {
    return null
  }
})

/** 进页面时拿到的版本号：提交时带着它，才谈得上乐观锁 */
const seenRevision = ref(order.value?.revision ?? 0)

/*
 * 把状态机翻译成动作清单。
 *
 * 每个目标状态一个动作，`states` 写的是「从哪些状态过得去」——于是
 * IDetailPage 自己就知道该摆出哪几个，而不需要这一页先筛一遍。
 */
const actionSpecs = computed<DetailActionSpec[]>(() => {
  const all = new Set<OrderStatus>()
  for (const targets of Object.values(ORDER_TRANSITIONS)) for (const t of targets) all.add(t)
  return [...all].map((to) => ({
    key: to,
    label: STATUS_LABEL[to],
    kind: to === 'approved' ? ('primary' as const) : to === 'cancelled' ? ('danger' as const) : undefined,
    states: Object.entries(ORDER_TRANSITIONS)
      .filter(([, targets]) => (targets as readonly string[]).includes(to))
      .map(([from]) => STATUS_LABEL[from]),
    // 审批类动作要审批权限；其余动作谁都能做
    permission: to === 'approved' || to === 'rejected' ? '审批' : undefined
  }))
})

const permissions = computed(() => (session.roles.includes('approver') ? ['审批'] : []))

/** 自己的单据自己审批：这类规则写不进状态机也写不进权限表 */
const denied = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  if (!order.value) return out
  const own = order.value.ownerId === session.personId && !session.roles.includes('admin')
  if (!own) return out
  out.approved = '不能审批自己提交的单据'
  out.rejected = out.approved
  return out
})

function run(key: string) {
  error.value = ''
  notice.value = ''
  try {
    const r = api.updateStatus(props.id, key as OrderStatus, seenRevision.value, session)
    seenRevision.value = r.order.revision
    version.value += 1
    notice.value = `已变为「${STATUS_LABEL[key]}」，版本 v${r.order.revision}`
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.code} ${e.message}（trace ${e.traceId}）` : String(e)
    version.value += 1
  }
}

/** 模拟别人在你停留期间改了这张单：让 409 那条分支真的能被看到 */
function simulateConcurrentEdit() {
  const current = api.getOrder(props.id).order
  const next = ORDER_TRANSITIONS[current.status][0]
  if (!next) {
    notice.value = '这张单已经走到终态，没有可以被别人改动的下一步了'
    return
  }
  api.updateStatus(props.id, next, current.revision, { personId: 'p-other', roles: ['admin'] })
  version.value += 1
  notice.value = `别人已经把它改成了「${STATUS_LABEL[next]}」，你手上的还是 v${seenRevision.value}`
}

function refresh() {
  seenRevision.value = api.getOrder(props.id).order.revision
  version.value += 1
  notice.value = `已取到最新版本 v${seenRevision.value}`
}
</script>

<template>
  <IDetailPage
    v-if="order"
    :title="order.id"
    :status="STATUS_LABEL[order.status]"
    :status-tone="STATUS_TONE[order.status]"
    :summary="`客户：${order.customer} · 负责人：${personName(order.ownerId)} · ${money(order.amount)} · 明细 ${order.lines.length} 行`"
    :actions="actionSpecs"
    :permissions="permissions"
    :seen-revision="seenRevision"
    :current-revision="order.revision"
    :denied="denied"
    :sibling-ids="siblingIds ?? []"
    :current-id="order.id"
    :return-ticket="returnTicket ?? ''"
    @action="run"
    @refresh="refresh"
    @back="emit('back')"
    @navigate="(id: string) => emit('open', id)"
  >
    <div class="detail__extras">
      <button class="detail__sim" type="button" @click="simulateConcurrentEdit">
        模拟他人修改（演示 409）
      </button>
      <p v-if="error" class="detail__error" role="alert">{{ error }}</p>
      <p v-if="notice" class="detail__notice" role="status">{{ notice }}</p>
    </div>
  </IDetailPage>

  <p v-else class="detail__error">找不到这张单：{{ id }}</p>
</template>

<style scoped>
.detail__extras {
  display: grid;
  gap: var(--i-spacing-2);
  justify-items: start;
}

.detail__sim {
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-elevated);
  color: var(--i-color-text-secondary);
  font: inherit;
  font-size: var(--i-font-size-sm);
  cursor: pointer;
}

.detail__error {
  margin: 0;
  color: var(--i-color-danger-text);
  font-size: var(--i-font-size-sm);
}

.detail__notice {
  margin: 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
</style>
