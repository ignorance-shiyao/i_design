import type { FrameworkId } from './frameworks'

/**
 * 同一个用法在各端怎么写。
 *
 * 这些片段不是「示意代码」：属性名、事件名都取自各端的真实实现，
 * scripts/check-snippets.mjs 会逐个核对——片段里出现的属性必须在那一端确实存在，
 * 否则构建失败。文档写错的用法比没有文档更费时间。
 */
export type SnippetSet = Partial<Record<FrameworkId, string>>

export const snippets: Record<string, SnippetSet> = {
  button: {
    'vue-next': `<script setup lang="ts">
import { IButton } from '@i-design/vue-next'
</script>

<template>
  <IButton variant="primary" size="md" @click="onSubmit">提交</IButton>
  <IButton variant="secondary" :loading="saving">保存</IButton>
</template>`,
    vue: `<script>
import { IButton } from '@i-design/vue'
export default { components: { IButton } }
</script>

<template>
  <div>
    <IButton variant="primary" size="md" @click="onSubmit">提交</IButton>
    <IButton variant="secondary" :loading="saving">保存</IButton>
  </div>
</template>`,
    react: `import { Button } from '@i-design/react'

export function Actions({ saving, onSubmit }) {
  return (
    <>
      <Button variant="primary" size="md" onClick={onSubmit}>提交</Button>
      <Button variant="secondary" loading={saving}>保存</Button>
    </>
  )
}`,
    miniprogram: `<!-- index.json: { "usingComponents": { "i-button": "/components/button/index" } } -->
<i-button variant="primary" size="md" bindtap="onSubmit">提交</i-button>
<i-button variant="secondary" loading="{{saving}}">保存</i-button>`,
    'mobile-vue': `<script setup lang="ts">
// 移动端复用同一批组件，只是触控尺度由覆盖层调到 44px
import { IButton } from '@i-design/mobile-vue'
</script>

<template>
  <IButton variant="primary" block @click="onSubmit">提交</IButton>
</template>`,
    'mobile-react': `import { Button } from '@i-design/mobile-react'

export function SubmitBar({ onSubmit }) {
  // block 让按钮占满一行，这是移动端表单底部的常见形态
  return <Button variant="primary" block onClick={onSubmit}>提交</Button>
}`,
    flutter: `import 'package:i_design/i_design.dart';

IButton(
  variant: IButtonVariant.primary,
  size: IButtonSize.md,
  onPressed: onSubmit,
  child: const Text('提交'),
)`
  },

  select: {
    'vue-next': `<script setup lang="ts">
import { ref } from 'vue'
import { ISelect } from '@i-design/vue-next'

const city = ref<string | null>(null)
const options = [
  { value: 'hz', label: '杭州' },
  { value: 'sh', label: '上海' },
  { value: 'bj', label: '北京', disabled: true }
]
</script>

<template>
  <ISelect v-model="city" :options="options" clearable />
</template>`,
    vue: `<script>
import { ref } from 'vue'
import { ISelect } from '@i-design/vue'

export default {
  components: { ISelect },
  setup() {
    // Vue 2 的 v-model 走 value / input，组件已按这套约定实现
    return { city: ref(null), options: [
      { value: 'hz', label: '杭州' },
      { value: 'sh', label: '上海' }
    ] }
  }
}
</script>

<template>
  <ISelect v-model="city" :options="options" clearable />
</template>`,
    react: `import { useState } from 'react'
import { Select } from '@i-design/react'

export function CityPicker() {
  const [city, setCity] = useState(null)
  return (
    <Select
      value={city}
      options={[
        { value: 'hz', label: '杭州' },
        { value: 'sh', label: '上海' }
      ]}
      clearable
      onChange={setCity}
    />
  )
}`,
    miniprogram: `<!-- index.json: { "usingComponents": { "i-select": "/components/select/index" } } -->
<i-select
  value="{{city}}"
  options="{{options}}"
  clearable
  bindchange="onCityChange"
/>`,
    flutter: `import 'package:i_design/i_design.dart';

ISelect(
  value: city,
  options: const [
    ISelectOption(value: 'hz', label: '杭州'),
    ISelectOption(value: 'sh', label: '上海'),
  ],
  clearable: true,
  onChanged: (value) => setState(() => city = value),
)`
  },

  pagination: {
    'vue-next': `<script setup lang="ts">
import { ref } from 'vue'
import { IPagination } from '@i-design/vue-next'

const page = ref(1)
</script>

<template>
  <IPagination v-model="page" :total="240" :page-size="10" />
</template>`,
    vue: `<template>
  <!-- Vue 2 的 v-model 走 value / input，写 v-model 同样可用 -->
  <IPagination v-model="page" :total="240" :page-size="10" @change="onPageChange" />
</template>`,
    react: `import { Pagination } from '@i-design/react'

<Pagination current={page} total={240} pageSize={10} onChange={setPage} />`,
    miniprogram: `<i-pagination
  current="{{page}}"
  total="{{240}}"
  page-size="{{10}}"
  bindchange="onPageChange"
/>`,
    flutter: `IPagination(
  current: page,
  total: 240,
  pageSize: 10,
  onChanged: (next) => setState(() => page = next),
)`
  }
}

/** 各端共享的那部分——放在跨端页上说明「为什么它们必然一致」 */
export const sharedLogicSnippet = `// packages/common/src/logic/pagination.ts —— 七端共用的同一份规则
export function buildPages(current: number, pageCount: number, maxVisible = 5): PageItem[] {
  const count = Math.max(1, pageCount)
  const window = Math.max(1, maxVisible)
  if (count <= window + 2) return Array.from({ length: count }, (_, i) => i + 1)
  // …首尾页恒在，中间窗口跟随当前页滑动，断开处以 'left' / 'right' 占位
}`
