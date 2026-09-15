<script setup lang="ts">
/**
 * 示例应用的壳：在库组件 IAppShell 之上补一层「示例特有」的东西——
 * 应用切换器与源码入口。
 *
 * 形态先在这里跑过一轮，验证过之后才抽成库组件（B01）；现在这份只剩示例
 * 自己的部分，导航、面包屑、抽屉、焦点归位都由 IAppShell 负责。
 * 这正是计划里说的「先通过一个业务切片验证抽象，再拆包」。
 */
import { computed } from 'vue'
import { IAppShell } from '@i-design/vue-next'
import type { IconName } from '@i-design/common'
import { exampleApps, type ExampleApp } from './apps'

const props = withDefaults(
  defineProps<{
    /** 当前应用 id，与 apps.ts 对齐 */
    appId: string
    nav: { key: string; label: string; icon?: IconName }[]
    current: string
    crumbs?: { label: string; key?: string }[]
    user?: string
  }>(),
  { crumbs: () => [], user: '林岚（销售经理）' }
)

const emit = defineEmits<{ navigate: [key: string] }>()

const app = computed<ExampleApp | undefined>(() => exampleApps.find((a) => a.id === props.appId))
</script>

<template>
  <IAppShell
    :title="app?.name ?? appId"
    :user="user"
    :nav="nav"
    :current="current"
    :crumbs="crumbs.map((c) => ({ label: c.label }))"
    @navigate="(key: string) => emit('navigate', key)"
  >
    <!-- 应用切换器是示例特有的，所以留在这一层：规划中的应用不给链接 -->
    <template #topbar>
      <nav class="shell__apps" aria-label="示例应用">
        <a class="shell__app" href="../portal/">← 示例门户</a>
        <template v-for="item in exampleApps" :key="item.id">
          <a
            v-if="item.status === 'ready' && item.id !== appId"
            class="shell__app"
            :href="item.path"
          >{{ item.name }}</a>
          <span v-else-if="item.status !== 'ready'" class="shell__app is-planned" :title="item.summary">
            {{ item.name }}（规划中）
          </span>
        </template>
      </nav>
    </template>

    <template #drawer>
      <a class="shell__app" href="../portal/">← 示例门户</a>
      <a
        v-for="item in exampleApps.filter((a) => a.status === 'ready' && a.id !== appId)"
        :key="item.id"
        class="shell__app"
        :href="item.path"
      >切到 {{ item.name }}</a>
    </template>

    <template #actions><slot name="actions" /></template>

    <slot />

    <p class="shell__source">这一页的源码：<code>{{ app?.source }}</code></p>
  </IAppShell>
</template>

<style scoped>
.shell__apps {
  display: flex;
  gap: var(--i-spacing-3);
  min-width: 0;
  overflow-x: auto;
}

.shell__app {
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
  text-decoration: none;
  white-space: nowrap;
}

.shell__app.is-planned {
  color: var(--i-color-text-tertiary);
}

.shell__source {
  margin: 0;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
}
</style>
