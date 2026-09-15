<script setup lang="ts">
/**
 * 新建订单。
 *
 * 表单壳换成了 IFormPage（B09），于是「重复提交拦不拦」「失败之后输入还在不在」
 * 「改了一半点取消要不要问一句」都归它管，这一页只管业务。
 *
 * 两件事仍然是这一页存在的理由，而不是表单本身：
 *
 * 1. **重复提交。** 前后两道：IFormPage 在提交期间把按钮停掉，挡住手抖点两下；
 *    幂等键整页只生成一次，挡住「按钮停用之前那一瞬间连点两下」与断线重发——
 *    第二道才是真的挡住，第一道只是不让人觉得点了没反应。
 *    示例里留了「再提交一次」的按钮，好让第二道看得见。
 * 2. **校验失败不清空输入。** 没有明细时 API 返回 422，页面把话说清楚，
 *    但已经填的客户名留在原地——失败就清空是最招人恨的一种表单。
 *    IFormPage 的 failed 是个可以继续提交的状态，不是一次重来。
 *
 * 这里刻意不把「没有明细」接到 IFormPage 的 valid 上。valid 是给**表单自己的
 * 校验**用的；把服务端那条规则在前端再写一遍，提交按钮就会先一步变灰，
 * 于是 422 这条分支从界面上永远走不到——而它正是这一页要演的东西。
 * 第一版改造就是这么写的，跑起来才发现点不动。
 */
import { computed, ref } from 'vue'
import { IButton, IFormPage, IInput } from '@i-design/vue-next'
import type { SubmitPhase } from '@i-design/common'
import { ApiError } from '@i-design/examples-shared'
import { api, money, session } from '../data'

const emit = defineEmits<{ created: [id: string]; cancelled: [] }>()

const customer = ref('明远制造')
const lines = ref([{ sku: 'SKU-1001', name: '高速轴承', quantity: 20, unitPrice: 128000 }])
/* 幂等键整页只生成一次：每次提交都换一个的话，它就没有任何作用 */
const idempotencyKey = ref(`create-${Date.now().toString(36)}`)

const error = ref('')
const result = ref<{ id: string; deduplicated: boolean } | null>(null)
const phase = ref<SubmitPhase>('idle')

/*
 * 交给表单壳的那份值。壳靠它与 initial 比对，算出「改了几项没保存」——
 * 明细也算进去，不然加了三行明细再点取消会被直接放走。
 */
const values = computed<Record<string, unknown>>(() => ({
  customer: customer.value,
  lines: lines.value
}))
const initial = { customer: '明远制造', lines: [{ sku: 'SKU-1001', name: '高速轴承', quantity: 20, unitPrice: 128000 }] }

function addLine() {
  lines.value = [
    ...lines.value,
    { sku: `SKU-${1000 + lines.value.length + 2}`, name: '备件', quantity: 1, unitPrice: 9900 }
  ]
}

function clearLines() {
  lines.value = []
}

function submit() {
  error.value = ''
  phase.value = 'submitting'
  // 真链路上这里是一次网络往返，壳会在这段时间里把提交按钮停掉
  setTimeout(() => {
    try {
      const r = api.createOrder(
        { customer: customer.value, ownerId: session.personId, lines: lines.value },
        idempotencyKey.value
      )
      result.value = { id: r.order.id, deduplicated: r.deduplicated }
      phase.value = 'succeeded'
    } catch (e) {
      // 失败不清空输入：重填一遍是用户替实现擦屁股
      error.value = e instanceof ApiError ? `${e.code} ${e.message}（trace ${e.traceId}）` : String(e)
      phase.value = 'failed'
    }
  }, 500)
}

function reset() {
  customer.value = initial.customer
  lines.value = initial.lines.map((l) => ({ ...l }))
  error.value = ''
  result.value = null
  phase.value = 'idle'
}
</script>

<template>
  <IFormPage
    :model-value="values"
    :initial="initial"
    :phase="phase"
    :valid="true"
    :resubmittable="true"
    title="新建订单"
    description="提交期间按钮会停掉；清空明细再提交会拿到 422，而已经填的客户名留在原地。"
    submit-text="提交"
    @submit="submit"
    @reset="reset"
    @cancel="emit('cancelled')"
  >
    <div class="create">
      <label class="create__field">
        <span>客户</span>
        <IInput v-model="customer" />
      </label>

      <div class="create__lines">
        <p class="create__lines-title">
          明细（{{ lines.length }} 行，合计
          {{ money(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)) }}）
        </p>
        <ul>
          <li v-for="line in lines" :key="line.sku">
            {{ line.sku }} · {{ line.name }} × {{ line.quantity }} · {{ money(line.unitPrice) }}
          </li>
        </ul>
        <div class="create__row">
          <IButton size="sm" @click="addLine">加一行</IButton>
          <IButton size="sm" @click="clearLines">清空明细（演示 422）</IButton>
        </div>
      </div>

      <p v-if="error" class="create__error" role="alert">{{ error }}</p>

      <p v-if="result" class="create__ok" role="status">
        已创建 {{ result.id }}。{{
          result.deduplicated
            ? '这一次是重复提交：返回的是同一张单，没有开出第二张。'
            : '再点一次「提交」，会看到它返回同一张单——幂等键整页只有一个。'
        }}
        <a :href="`#/orders/${result.id}`" @click="emit('created', result.id)">去看详情</a>
      </p>
    </div>
  </IFormPage>
</template>

<style scoped>
.create {
  display: grid;
  gap: var(--i-spacing-4);
  max-width: 560px;
}

.create__field {
  display: grid;
  gap: var(--i-spacing-1);
}

.create__lines {
  display: grid;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
}

.create__lines-title {
  margin: 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}

.create__lines ul {
  margin: 0;
  padding-left: var(--i-spacing-5);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}

.create__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
}

.create__error {
  margin: 0;
  color: var(--i-color-danger);
  font-size: var(--i-font-size-sm);
}

.create__ok {
  margin: 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
</style>
