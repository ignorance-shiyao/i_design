<script setup lang="ts">
/**
 * 示例应用的共用壳：应用切换、侧栏导航、面包屑、页面操作槽、移动抽屉。
 *
 * **为什么壳是共用的。** 五个示例应用要互相跳转，壳不一样的话，跳过去的第一眼
 * 会以为「换了个产品」。共用壳把「哪个应用」收到顶栏的一个切换器里，
 * 其余部分保持不动。
 *
 * **为什么窄屏是抽屉而不是把侧栏挤窄。** 挤窄之后每一项都只剩两三个字，
 * 认不出来还占着地方；抽屉是「要用时才出现，用完就还回去」。
 * 关掉抽屉时焦点回到触发它的按钮——不然读屏用户会被丢回页面顶部。
 *
 * 这一层属于示例，不进组件库覆盖矩阵：库里的 AppShell 是 B01，
 * 那是另一件事，做完之后这里会换成它。
 */
import { computed, nextTick, ref, watch } from 'vue'
import { IBreadcrumb, IButton, IIcon, ILayout } from '@i-design/vue-next'
import type { IconName } from '@i-design/common'
import { exampleApps, type ExampleApp } from './apps'

const props = withDefaults(
  defineProps<{
    /** 当前应用 id，与 apps.ts 对齐 */
    appId: string
    /** 侧栏导航 */
    nav: { key: string; label: string; icon?: IconName }[]
    /** 当前选中的导航项 */
    current: string
    /** 面包屑，从应用名之后开始写 */
    crumbs?: { label: string; key?: string }[]
    /** 当前用户显示名 */
    user?: string
  }>(),
  { crumbs: () => [], user: '林岚（销售经理）' }
)

const emit = defineEmits<{ navigate: [key: string] }>()

const app = computed<ExampleApp | undefined>(() => exampleApps.find((a) => a.id === props.appId))
const drawer = ref(false)
const drawerTrigger = ref<HTMLElement | null>(null)

/* 关抽屉时把焦点还回按钮：不还的话读屏用户会被丢回页面顶部重新找 */
watch(drawer, async (open) => {
  if (!open) {
    await nextTick()
    drawerTrigger.value?.focus()
  }
})

function go(key: string) {
  drawer.value = false
  emit('navigate', key)
}

/*
 * 面包屑一律不带链接：IBreadcrumb 的链接走 RouterLink，而示例应用是多页构建、
 * 不一定挂路由。跨应用的跳转在顶栏，面包屑在这里只负责说「你在哪儿」。
 */
const crumbItems = computed(() => [
  { label: app.value?.name ?? props.appId },
  ...props.crumbs.map((c) => ({ label: c.label }))
])
</script>

<template>
  <ILayout class="shell">
    <template #header>
      <div class="shell__bar">
        <button
          ref="drawerTrigger"
          type="button"
          class="shell__drawer-toggle"
          :aria-expanded="drawer"
          aria-label="打开导航"
          @click="drawer = true"
        >
          <IIcon name="menu" :size="18" />
        </button>

        <a class="shell__home" href="../portal/">i-design 示例</a>

        <!-- 应用切换：规划中的应用不给链接，给一个明确的「规划中」 -->
        <nav class="shell__apps" aria-label="示例应用">
          <template v-for="item in exampleApps" :key="item.id">
            <a
              v-if="item.status === 'ready'"
              class="shell__app"
              :class="{ 'is-current': item.id === appId }"
              :href="item.id === appId ? '#' : item.path"
              :aria-current="item.id === appId ? 'page' : undefined"
            >{{ item.name }}</a>
            <span v-else class="shell__app is-planned" :title="item.summary">
              {{ item.name }}（规划中）
            </span>
          </template>
        </nav>

        <span class="shell__user">{{ user }}</span>
      </div>
    </template>

    <template #aside>
      <nav class="shell__nav" aria-label="应用内导航">
        <button
          v-for="item in nav"
          :key="item.key"
          type="button"
          class="shell__nav-item"
          :class="{ 'is-on': item.key === current }"
          :aria-current="item.key === current ? 'page' : undefined"
          @click="go(item.key)"
        >
          <IIcon v-if="item.icon" :name="item.icon" :size="16" />
          {{ item.label }}
        </button>
      </nav>
    </template>

    <div class="shell__main">
      <div class="shell__crumbs">
        <IBreadcrumb :items="crumbItems" />
        <!-- 页面操作槽：新建、导出这类按钮固定落在这里，各页不必各摆一处 -->
        <div class="shell__actions"><slot name="actions" /></div>
      </div>

      <slot />

      <p class="shell__source">
        这一页的源码：<code>{{ app?.source }}</code>
      </p>
    </div>

    <!-- 窄屏抽屉：要用时才出现，用完还回去 -->
    <div v-if="drawer" class="shell__scrim" @click="drawer = false">
      <div class="shell__drawer" role="dialog" aria-label="导航" @click.stop>
        <IButton size="sm" @click="drawer = false">关闭</IButton>
        <!-- 窄屏顶栏放不下应用切换与用户名，它们挪到这里：入口不能消失，只能换地方 -->
        <p class="shell__drawer-user">{{ user }}</p>
        <a
          v-for="item in exampleApps.filter((a) => a.status === 'ready' && a.id !== appId)"
          :key="item.id"
          class="shell__nav-item"
          :href="item.path"
        >切到 {{ item.name }}</a>
        <button
          v-for="item in nav"
          :key="item.key"
          type="button"
          class="shell__nav-item"
          :class="{ 'is-on': item.key === current }"
          @click="go(item.key)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </ILayout>
</template>

<style scoped>
.shell__bar {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-4);
  padding: 0 var(--i-spacing-4);
  height: 100%;
  min-width: 0;
}

.shell__home {
  color: var(--i-color-text);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.shell__apps {
  display: flex;
  gap: var(--i-spacing-3);
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.shell__app {
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
  text-decoration: none;
  white-space: nowrap;
}

.shell__app.is-current {
  color: var(--i-color-brand-text);
  font-weight: 600;
}

.shell__app.is-planned {
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
  white-space: nowrap;
}

.shell__user {
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
  white-space: nowrap;
}

.shell__drawer-toggle {
  display: none;
  border: 0;
  background: transparent;
  color: var(--i-color-text);
  cursor: pointer;
}

.shell__nav {
  display: grid;
  gap: 2px;
  padding: var(--i-spacing-3);
}

.shell__nav-item {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border: 0;
  border-radius: var(--i-radius-md);
  background: transparent;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
  text-align: left;
  cursor: pointer;
}

.shell__nav-item.is-on {
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand-text);
}

.shell__main {
  display: grid;
  gap: var(--i-spacing-4);
  padding: var(--i-spacing-5) var(--i-spacing-4);
  min-width: 0;
}

/* 同理：正文区的每个子块都要能被压到比内容窄，否则表格会把整页顶宽 */
.shell__main > * {
  min-width: 0;
}

.shell__crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-3);
}

.shell__actions {
  display: flex;
  gap: var(--i-spacing-2);
}

.shell__source {
  margin: 0;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
}

.shell__drawer-user {
  margin: 0;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
}

.shell__scrim {
  position: fixed;
  inset: 0;
  background: rgba(20, 24, 34, 0.45);
  z-index: 40;
}

.shell__drawer {
  display: grid;
  gap: var(--i-spacing-2);
  align-content: start;
  width: min(280px, 82vw);
  height: 100%;
  padding: var(--i-spacing-4);
  background: var(--i-color-bg-elevated);
}

@media (max-width: 720px) {
  .shell__drawer-toggle {
    display: inline-flex;
  }

  /*
   * 顶栏在 320px 上放不下应用切换与用户名——硬塞的结果是整页横向滚动 8px，
   * 而那 8px 不会有人去拖，只会让页面看起来歪了一点。两者都挪进抽屉。
   */
  .shell__apps,
  .shell__user {
    display: none;
  }

  /* 窄屏收掉侧栏：挤窄之后每项只剩两三个字，认不出来还占着地方 */
  :deep(.i-layout__aside) {
    display: none;
  }
}
</style>
