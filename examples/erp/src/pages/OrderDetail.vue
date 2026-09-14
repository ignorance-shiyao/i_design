<script setup lang="ts">
/**
 * 订单详情与状态流转。
 *
 * 这一页要演的是三条真实分支，而不是「详情页长什么样」：
 *
 * - **403：不能审批自己提交的单据。** 前端也挡一次，是为了不让按钮点下去才发现；
 *   后端那份才是真的挡住。示例里两份都在。
 * - **409：详情页停留期间别人改过。** 带着进页面时拿到的 revision 提交，
 *   版本对不上就报出来，而不是「谁后提交谁说了算」。页面上给了一个
 *   「模拟他人修改」的按钮，好让这条看得见。
 * - **状态机拒绝**：草稿不能直接变成已发货，按钮只出现在允许的目标上。
 */
import { computed, ref } from 'vue'
import { IButton, ITag } from '@i-design/vue-next'
import { ApiError, ORDER_TRANSITIONS, type OrderStatus } from '@i-design/examples-shared'
import { STATUS_LABEL, STATUS_TONE, api, money, personName, session } from '../data'

const props = defineProps<{ id: string }>()
defineEmits<{ back: [] }>()

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

const targets = computed<OrderStatus[]>(() =>
  order.value ? [...ORDER_TRANSITIONS[order.value.status]] : []
)

/** 自己的单据自己审批：前端先挡一次，省得点下去才知道 */
const selfApproval = (to: OrderStatus) =>
  (to === 'approved' || to === 'rejected') &&
  order.value?.ownerId === session.personId &&
  !session.roles.includes('admin')

function move(to: OrderStatus) {
  error.value = ''
  notice.value = ''
  try {
    const r = api.updateStatus(props.id, to, seenRevision.value, session)
    seenRevision.value = r.order.revision
    version.value += 1
    notice.value = `已变为「${STATUS_LABEL[to]}」，版本 v${r.order.revision}`
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
  notice.value = `别人已经把它改成了「${STATUS_LABEL[next]}」，你手上的还是 v${seenRevision.value}——现在点任何状态按钮都会得到 409`
}
</script>

<template>
  <section v-if="order" class="detail">
    <header class="detail__head">
      <h2>{{ order.id }}</h2>
      <ITag :type="STATUS_TONE[order.status]">{{ STATUS_LABEL[order.status] }}</ITag>
      <span class="detail__rev">你看到的是 v{{ seenRevision }}</span>
    </header>

    <dl class="detail__fields">
      <div><dt>客户</dt><dd>{{ order.customer }}</dd></div>
      <div><dt>负责人</dt><dd>{{ personName(order.ownerId) }}</dd></div>
      <div><dt>金额</dt><dd>{{ money(order.amount) }}</dd></div>
      <div><dt>明细</dt><dd>{{ order.lines.length }} 行</dd></div>
    </dl>

    <div class="detail__actions">
      <IButton
        v-for="to in targets"
        :key="to"
        size="sm"
        :variant="to === 'approved' ? 'primary' : 'secondary'"
        :disabled="selfApproval(to)"
        :title="selfApproval(to) ? '不能审批自己提交的单据' : undefined"
        @click="move(to)"
      >
        {{ STATUS_LABEL[to] }}
      </IButton>
      <span v-if="!targets.length" class="detail__rev">终态，没有下一步</span>
    </div>

    <p v-if="targets.some(selfApproval)" class="detail__rev">
      「通过 / 退回」是灰的：这张单是你自己提交的，不能自己审批。换个身份才点得动，
      而后端那份规则会在任何情况下挡住。
    </p>

    <div class="detail__row">
      <IButton size="sm" @click="simulateConcurrentEdit">模拟他人修改（演示 409）</IButton>
    </div>

    <p v-if="error" class="detail__error" role="alert">{{ error }}</p>
    <p v-if="notice" class="detail__notice" role="status">{{ notice }}</p>
  </section>

  <p v-else class="detail__error">找不到这张单：{{ id }}</p>
</template>

<style scoped>
.detail {
  display: grid;
  gap: var(--i-spacing-4);
}

.detail__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--i-spacing-3);
}

.detail__head h2 {
  margin: 0;
  font-size: var(--i-font-size-lg);
}

.detail__rev {
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
}

.detail__fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
  gap: var(--i-spacing-3);
  margin: 0;
}

.detail__fields dt {
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
}

.detail__fields dd {
  margin: 2px 0 0;
  color: var(--i-color-text);
}

.detail__actions,
.detail__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
  align-items: center;
}

.detail__error {
  margin: 0;
  color: var(--i-color-danger);
  font-size: var(--i-font-size-sm);
}

.detail__notice {
  margin: 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
</style>
