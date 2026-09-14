<script setup lang="ts">
/**
 * 行内节点的递归渲染。加下划线前缀表示它是内部件，不进组件清单。
 *
 * 用组件递归而不是拼字符串：拼出来的 HTML 要么得用 v-html（那就把前面
 * 所有的清洗白做了），要么在小程序与 Flutter 上根本没法渲染。
 */
import type { MdInline } from '@i-design/common'

defineProps<{ nodes: MdInline[] }>()
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <code v-if="node.type === 'code'" class="i-md__code">{{ node.text }}</code>
    <strong v-else-if="node.type === 'strong'"><_MdInline :nodes="node.children" /></strong>
    <em v-else-if="node.type === 'em'"><_MdInline :nodes="node.children" /></em>
    <del v-else-if="node.type === 'del'"><_MdInline :nodes="node.children" /></del>
    <!-- 地址已经过 safeHref；外链一律新窗口 + noreferrer -->
    <a
      v-else-if="node.type === 'link'"
      class="i-md__link"
      :href="node.href"
      :target="node.href.startsWith('http') ? '_blank' : undefined"
      :rel="node.href.startsWith('http') ? 'noopener noreferrer' : undefined"
    ><_MdInline :nodes="node.children" /></a>
    <img v-else-if="node.type === 'image'" class="i-md__image" :src="node.src" :alt="node.alt" loading="lazy" />
    <template v-else>{{ node.text }}</template>
  </template>
</template>
