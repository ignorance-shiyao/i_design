<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IAppShell.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 应用骨架：顶栏、侧栏导航、面包屑、页面操作槽、窄屏抽屉（astra.md 的 B01）。
 *
 * 形态先在示例应用里跑过一轮（examples/shell），这里是把它抽成库组件——
 * 不是照搬：示例那份写死了「示例应用」的应用切换器，库组件里那块是插槽。
 *
 * **为什么窄屏是抽屉而不是把侧栏挤窄。** 挤窄之后每一项只剩两三个字，
 * 认不出来还占着地方；抽屉是「要用时才出现，用完就还回去」。
 *
 * **为什么关抽屉要把焦点还给按钮。** 不还的话，读屏与键盘用户会被丢回页面顶部，
 * 得从头 Tab 一遍才能回到刚才那个位置。Esc 也要能关——打开的浮层一律如此，
 * 否则键盘用户会被困在里面。
 *
 * 组件不认识路由：导航项点了只抛事件，由页面决定怎么跳。内置路由的话，
 * 换一个路由库就得改组件。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IBreadcrumb from './IBreadcrumb.vue'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'

export interface AppNavItem {
  key: string
  label: string
  icon?: IconName
  /** 二级导航。只支持两级——三级以上的树在侧栏里没人找得到 */
  children?: { key: string; label: string }[]
}

const props = withDefaults(
  defineProps<{
    /** 侧栏导航 */
    nav: AppNavItem[]
    /** 当前选中的导航项 key。深链刷新后由页面从地址里解析出来传进来 */
    current: string
    /** 面包屑，从应用名之后开始写 */
    crumbs?: { label: string }[]
    /** 应用名，显示在顶栏左侧 */
    title?: string
    /** 当前用户，显示在顶栏右侧 */
    user?: string
    /** 窄屏断点（px）。小于它时侧栏收进抽屉 */
    breakpoint?: number
  }>(),
  { crumbs: () => [], title: '', user: '', breakpoint: 720 }
)

const emit = defineEmits<{ (e: 'navigate', key: string): void }>()

const drawer = ref(false)
const trigger = ref<HTMLElement | null>(null)

/* 关抽屉时把焦点还回按钮：不还的话键盘用户被丢回页面顶部 */
watch(drawer, async (open) => {
  if (!open) {
    await nextTick()
    trigger.value?.focus()
  }
})

function onKey(event: KeyboardEvent) {
  // Esc 关闭：打开的浮层一律如此，否则键盘用户会被困在里面
  if (event.key === 'Escape' && drawer.value) drawer.value = false
}

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

function go(key: string) {
  drawer.value = false
  emit('navigate', key)
}

const crumbItems = computed(() => [
  ...(props.title ? [{ label: props.title }] : []),
  ...props.crumbs
])

/** 当前项属于哪个一级导航——二级选中时它的父项也要显示为激活 */
const activeParent = computed(
  () =>
    props.nav.find(
      (item) => item.key === props.current || item.children?.some((c) => c.key === props.current)
    )?.key ?? ''
)
</script>

<template>
  <div class="i-app-shell" :style="{ '--i-app-shell-breakpoint': `${breakpoint}px` }">
    <header class="i-app-shell__bar">
      <button
        ref="trigger"
        type="button"
        class="i-app-shell__toggle"
        :aria-expanded="String(drawer)"
        aria-label="打开导航"
        @click="drawer = true"
      >
        <IIcon name="menu" :size="18" />
      </button>

      <span v-if="title" class="i-app-shell__title">{{ title }}</span>
      <!-- 顶栏中段留给应用自己：切换器、搜索、环境标记，各家都不一样 -->
      <div class="i-app-shell__slot"><slot name="topbar" /></div>
      <span v-if="user" class="i-app-shell__user">{{ user }}</span>
    </header>

    <div class="i-app-shell__body">
      <nav class="i-app-shell__aside" aria-label="主导航">
        <template v-for="item in nav" :key="item.key">
          <button
            type="button"
            class="i-app-shell__nav"
            :class="{ 'is-on': item.key === current, 'is-parent': activeParent === item.key }"
            :aria-current="item.key === current ? 'page' : undefined"
            @click="go(item.key)"
          >
            <IIcon v-if="item.icon" :name="item.icon" :size="16" />
            {{ item.label }}
          </button>
          <button
            v-for="child in item.children ?? []"
            :key="child.key"
            type="button"
            class="i-app-shell__nav is-child"
            :class="{ 'is-on': child.key === current }"
            :aria-current="child.key === current ? 'page' : undefined"
            @click="go(child.key)"
          >
            {{ child.label }}
          </button>
        </template>
      </nav>

      <main class="i-app-shell__main">
        <div class="i-app-shell__head">
          <IBreadcrumb v-if="crumbItems.length" :items="crumbItems" />
          <!-- 页面操作槽：新建、导出这类按钮固定落在这里，各页不必各摆一处 -->
          <div class="i-app-shell__actions"><slot name="actions" /></div>
        </div>
        <slot />
      </main>
    </div>

    <!-- 窄屏抽屉：要用时才出现，用完就还回去 -->
    <div v-if="drawer" class="i-app-shell__scrim" @click="drawer = false">
      <div class="i-app-shell__drawer" role="dialog" aria-modal="true" aria-label="导航" @click.stop>
        <button type="button" class="i-app-shell__close" @click="drawer = false">关闭</button>
        <slot name="drawer" />
        <template v-for="item in nav" :key="`d-${item.key}`">
          <button
            type="button"
            class="i-app-shell__nav"
            :class="{ 'is-on': item.key === current }"
            @click="go(item.key)"
          >
            {{ item.label }}
          </button>
          <button
            v-for="child in item.children ?? []"
            :key="`d-${child.key}`"
            type="button"
            class="i-app-shell__nav is-child"
            :class="{ 'is-on': child.key === current }"
            @click="go(child.key)"
          >
            {{ child.label }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
