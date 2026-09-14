<script setup lang="ts">
import { ref } from 'vue'
import IPageState from '@/components/IPageState.vue'
import ISegmented from '@/components/ISegmented.vue'
import IButton from '@/components/IButton.vue'
import ITable from '@/components/ITable.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import Playground from '@/site/Playground.vue'
import { message } from '@/components/message'

/** 演示用的一小段数据：部分成功与过期两态都要「内容还在」才说得清 */
const columns = [
  { key: 'id', title: '单号' },
  { key: 'customer', title: '客户' },
  { key: 'amount', title: '金额', align: 'right' as const }
]
const rows = [
  { id: 'SO-2026-0007', customer: '明远制造', amount: '¥ 12,800' },
  { id: 'SO-2026-0008', customer: '合力重工', amount: '¥ 26,400' }
]

const scene = ref<'loading' | 'empty' | 'failed' | 'forbidden' | 'offline' | 'partial' | 'stale'>('partial')

const scenes = {
  loading: { loading: true, loaded: 0 },
  empty: { loaded: 0 },
  failed: { error: { code: 502, message: '网关错误' }, loaded: 0 },
  forbidden: { error: { code: 403 }, loaded: 0 },
  offline: { online: false, loaded: rows.length },
  partial: { loaded: 18, failed: 2, error: { message: '有 2 行没进去' } },
  stale: { loaded: rows.length, fetchedAt: Date.now() - 5 * 60_000, staleAfter: 60_000 }
} as const
</script>

<template>
  <article>
    <h1>PageState 页面状态</h1>
    <p class="i-lead">
      一块内容区在真实系统里有七种样子：加载中、空、无权限、失败、离线、部分成功、数据过期。这七种在每个页面里都会被重写一遍，写到第三个页面时，「部分成功」就开始被当成「失败」处理——已经成功的那批数据被一并清空，用户得从头再来一次。
    </p>

    <h2>现场调参</h2>
    <p>判定顺序是这个组件唯一的复杂度：两种情况同时成立时，它显示哪一个。</p>
    <Playground
      name="IPageState"
      :is="IPageState"
      :only="['loading', 'online', 'loaded', 'failed', 'emptyType', 'title']"
    />

    <DemoBlock
      title="七种状态"
      description="切换看每一种的样子。注意「部分成功」「离线」「数据过期」下，已经拿到的内容仍然在。"
      lang="vue"
      code='<IPageState :loaded="18" :failed="2" :error="{ message: &apos;有 2 行没进去&apos; }" @action="retry">
  <OrderTable />
</IPageState>'
    >
      <div class="scene">
        <ISegmented
          v-model="scene"
          :options="[
            { label: '加载中', value: 'loading' },
            { label: '空', value: 'empty' },
            { label: '失败', value: 'failed' },
            { label: '无权限', value: 'forbidden' },
            { label: '离线', value: 'offline' },
            { label: '部分成功', value: 'partial' },
            { label: '数据过期', value: 'stale' }
          ]"
          aria-label="状态场景"
        />
        <IPageState v-bind="scenes[scene]" @action="(kind) => message.info(`触发了「${kind}」`)">
          <ITable :columns="columns" :data="rows" />
        </IPageState>
      </div>
    </DemoBlock>

    <DemoBlock
      title="空态给得出下一步"
      description="空不是错误。空态要说清为什么空，并给出把它填满的那个动作。"
      lang="vue"
      code='<IPageState :loaded="0" empty-type="search">
  <template #empty-action><IButton variant="primary">清空筛选</IButton></template>
</IPageState>'
    >
      <IPageState :loaded="0" empty-type="search">
        <template #empty-action>
          <IButton variant="primary" size="sm">清空筛选</IButton>
        </template>
      </IPageState>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>整页级的结果页——那是 Result：提交成功、404、500 这类占满一屏的结论，不是一块内容区的状态。</li>
      <li>只有「有数据 / 没数据」两种情况时——直接用 Empty，多一层判定只会让代码更难读。</li>
      <li>表单字段级的错误——那属于字段自己的校验提示，放到页面级会让人找不到是哪一项填错了。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>loading</td><td><code>boolean</code></td><td><code>false</code></td><td>是否正在请求</td></tr>
        <tr><td>online</td><td><code>boolean</code></td><td><code>true</code></td><td>网络是否可用；离线优先于其余所有状态</td></tr>
        <tr><td>error</td><td><code>{ code?, message? } | null</code></td><td><code>null</code></td><td>403 会被识别成无权限，给的是申请入口而不是重试</td></tr>
        <tr><td>loaded</td><td><code>number</code></td><td><code>0</code></td><td>已拿到的条数；它 &gt; 0 时失败会被判成部分成功</td></tr>
        <tr><td>failed</td><td><code>number</code></td><td><code>0</code></td><td>本次失败的条数</td></tr>
        <tr><td>fetchedAt / staleAfter</td><td><code>number</code></td><td>—</td><td>两者都给才判「数据过期」</td></tr>
        <tr><td>emptyType</td><td><code>'empty' | 'search' | 'error' | 'permission'</code></td><td><code>empty</code></td><td>空态的成因，决定插画与默认文案</td></tr>
        <tr><td>@action</td><td><code>(kind: string) =&gt; void</code></td><td>—</td><td>用户点了恢复动作，kind 是 retry / refresh / request-access 之一</td></tr>
      </tbody>
    </table>

    <h2>判定顺序</h2>
    <p>
      离线 → 无权限 → 部分成功 → 失败 → 加载中 → 空 → 过期 → 正常。离线排第一，因为断网时其余每一种都会同时成立，而「没网」是唯一用户能处理的那条；部分成功排在失败前面，否则已经成功的那批会被一并判成失败、从屏幕上清掉——那是最难被发现、也最惹人恼火的一种错。
    </p>
  </article>
</template>

<style scoped>
.scene { display: flex; flex-direction: column; gap: var(--i-spacing-4); width: 100%; }
</style>
