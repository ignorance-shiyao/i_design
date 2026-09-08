<script setup lang="ts">
import { computed } from 'vue'
import ITag from '@/components/ITag.vue'
import IProgress from '@/components/IProgress.vue'
import { antdCoverage } from '@/data/antdCoverage'

const all = computed(() => antdCoverage.flatMap((g) => g.items))
const ready = computed(() => all.value.filter((i) => i.status === 'ready').length)
const planned = computed(() => all.value.filter((i) => i.status === 'planned').length)
const skipped = computed(() => all.value.filter((i) => i.status === 'skipped').length)
// 覆盖率的分母不含「有意不做」的项：把它们算进去只会得到一个永远到不了 100% 的数字
const percent = computed(() => (ready.value / (ready.value + planned.value)) * 100)

const label: Record<string, string> = { ready: '已实现', planned: '规划中', skipped: '不做' }
const tagType: Record<string, 'success' | 'warning' | 'default'> = {
  ready: 'success',
  planned: 'warning',
  skipped: 'default'
}
</script>

<template>
  <article>
    <h1>对照 Ant Design</h1>
    <p class="i-lead">
      以 Ant Design v5 的组件总览为标尺，逐项对照本体系的覆盖情况。
      不是把它抄一遍——有几项属于 React 的运行时机制而不是视觉组件，列在这里并注明为什么不做，
      比让使用者自己去猜要诚实。
    </p>

    <div class="cov-summary">
      <IProgress :percent="percent" :text="`${ready} / ${ready + planned}`" size="lg" />
      <p class="cov-summary__note">
        已实现 {{ ready }} 项，规划中 {{ planned }} 项，另有 {{ skipped }} 项有意不做（不计入分母，
        否则这个数字永远到不了 100%）。
      </p>
    </div>

    <section v-for="group in antdCoverage" :key="group.title" class="cov-group">
      <h2>{{ group.title }}</h2>
      <table class="i-table">
        <thead>
          <tr>
            <th style="width: 26%">Ant Design</th>
            <th style="width: 30%">本体系</th>
            <th style="width: 14%">状态</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in group.items" :key="item.antd">
            <td>{{ item.antd }}</td>
            <td><code v-if="item.ours">{{ item.ours }}</code><span v-else class="cov-dash">—</span></td>
            <td><ITag :type="tagType[item.status]">{{ label[item.status] }}</ITag></td>
            <td class="cov-note">{{ item.note || '' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </article>
</template>

<style scoped>
.cov-summary {
  margin: var(--i-spacing-6) 0 var(--i-spacing-10);
  padding: var(--i-spacing-5);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-subtle);
}
.cov-summary__note {
  margin-top: var(--i-spacing-3);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}
.cov-group { margin-bottom: var(--i-spacing-8); }
.cov-dash { color: var(--i-color-text-tertiary); }
.cov-note { color: var(--i-color-text-tertiary); font-size: var(--i-font-size-sm); }
</style>
