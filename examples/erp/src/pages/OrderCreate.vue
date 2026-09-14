<script setup lang="ts">
/**
 * 新建订单。
 *
 * 两件事是这一页存在的理由，而不是表单本身：
 *
 * 1. **重复提交。** 幂等键在进入页面时就生成，整页只有一个：用户手抖点两下、
 *    或者网络慢时自己又点了一次，返回的是同一张单，而不是两张。
 *    示例里给了一个「再提交一次」的按钮，好让这件事看得见。
 * 2. **校验失败不清空输入。** 没有明细时 API 返回 422，页面把话说清楚，
 *    但已经填的客户名留在原地——失败就清空是最招人恨的一种表单。
 */
import { ref } from 'vue'
import { IButton, IInput } from '@i-design/vue-next'
import { ApiError } from '@i-design/examples-shared'
import { api, money, session } from '../data'

const emit = defineEmits<{ created: [id: string] }>()

const customer = ref('明远制造')
const lines = ref([{ sku: 'SKU-1001', name: '高速轴承', quantity: 20, unitPrice: 128000 }])
/* 幂等键整页只生成一次：每次提交都换一个的话，它就没有任何作用 */
const idempotencyKey = ref(`create-${Date.now().toString(36)}`)

const error = ref('')
const result = ref<{ id: string; deduplicated: boolean } | null>(null)

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
  try {
    const r = api.createOrder(
      { customer: customer.value, ownerId: session.personId, lines: lines.value },
      idempotencyKey.value
    )
    result.value = { id: r.order.id, deduplicated: r.deduplicated }
  } catch (e) {
    // 失败不清空输入：重填一遍是用户替实现擦屁股
    error.value = e instanceof ApiError ? `${e.code} ${e.message}（trace ${e.traceId}）` : String(e)
  }
}
</script>

<template>
  <section class="create">
    <label class="create__field">
      <span>客户</span>
      <IInput v-model="customer" />
    </label>

    <div class="create__lines">
      <p class="create__lines-title">明细（{{ lines.length }} 行，合计 {{ money(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)) }}）</p>
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

    <div class="create__row">
      <IButton variant="primary" @click="submit">提交</IButton>
      <IButton v-if="result" @click="submit">再提交一次（演示幂等）</IButton>
    </div>

    <p v-if="error" class="create__error" role="alert">{{ error }}</p>

    <p v-if="result" class="create__ok" role="status">
      已创建 {{ result.id }}。{{
        result.deduplicated
          ? '这一次是重复提交：返回的是同一张单，没有开出第二张。'
          : '再点一次「再提交一次」，会看到它返回同一张单。'
      }}
      <a :href="`#/orders/${result.id}`" @click="emit('created', result.id)">去看详情</a>
    </p>
  </section>
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
