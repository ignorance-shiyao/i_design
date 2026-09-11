<script setup lang="ts">
/**
 * 页面骨架：顶栏、侧栏、正文、底栏。
 *
 * 只摆位置，不管内容——页面级的结构一旦被组件塞进具体内容，换一个产品就只能重写。
 * 四块都用语义标签落地（header / aside / main / footer）：
 * 读屏用户靠这几个地标在页面里跳转，全是 div 的页面对他们来说是一整块。
 */
withDefaults(
  defineProps<{
    /** 侧栏在哪一边 */
    asidePlacement?: 'left' | 'right'
    /** 侧栏收起，只留图标宽度。不整个藏掉——入口消失比变窄更难找回来 */
    collapsed?: boolean
    /** 侧栏宽度，接受任意 CSS 长度 */
    asideWidth?: string
    headerHeight?: string
  }>(),
  { asidePlacement: 'left', collapsed: false, asideWidth: '', headerHeight: '' }
)
</script>

<template>
  <div
    class="i-layout"
    :class="`i-layout--aside-${asidePlacement}`"
    :style="{
      '--i-layout-aside-width': asideWidth || undefined,
      '--i-layout-header-height': headerHeight || undefined
    }"
  >
    <header v-if="$slots.header" class="i-layout__header"><slot name="header" /></header>

    <div class="i-layout__row">
      <aside
        v-if="$slots.aside"
        class="i-layout__aside"
        :class="{ 'is-collapsed': collapsed }"
      >
        <slot name="aside" />
      </aside>
      <main class="i-layout__content"><slot /></main>
    </div>

    <footer v-if="$slots.footer" class="i-layout__footer"><slot name="footer" /></footer>
  </div>
</template>
