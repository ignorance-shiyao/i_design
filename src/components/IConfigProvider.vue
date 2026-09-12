<script setup lang="ts">
import { computed, provide } from 'vue'
import { resolveLocale, zhCN, type Locale } from '@i-design/common'
import { configKey } from './context'

/**
 * 全局配置。包住一棵子树，里面的组件就用这里给的字典与默认尺寸。
 *
 * 用 provide 而不是模块级单例：同一个页面里可能嵌着一块另一种语言的内容
 * （英文合同原文旁边配中文说明），单例表达不了「这一块用另一份字典」。
 * 嵌套时内层覆盖外层——这正是 provide/inject 天然的行为。
 */
const props = withDefaults(
  defineProps<{
    /** 完整字典，或只写要改的那几句 */
    locale?: Partial<Locale>
    /** 换一份基准字典，例如 enUS。不传则以中文为基准 */
    base?: Locale
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { locale: () => ({}), base: () => zhCN, size: 'md' }
)

const locale = computed(() => resolveLocale(props.locale, props.base))

provide(configKey, {
  locale,
  size: computed(() => props.size)
})
</script>

<template>
  <!--
    不额外包一层元素：配置是纯粹的上下文，多出来的 div 会打断 flex/grid 的父子关系，
    接上去才发现布局塌了。
  -->
  <slot />
</template>
