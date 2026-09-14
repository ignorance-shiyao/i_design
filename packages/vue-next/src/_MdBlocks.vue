<script setup lang="ts">
/**
 * 块级节点的递归渲染。加下划线前缀表示它是内部件，不进组件清单。
 *
 * 引用与列表项里还能再出现块，所以这个组件要能递归调用自己——
 * 这也是不拼 HTML 字符串的直接好处：递归由组件系统负责，不必自己拼括号。
 */
import type { MdBlock } from '@i-design/common'
import MdInline from './_MdInline.vue'
import ICodeBlock from './ICodeBlock.vue'

defineProps<{ blocks: MdBlock[] }>()
</script>

<template>
  <template v-for="(block, index) in blocks" :key="index">
    <component
      :is="`h${block.level}`"
      v-if="block.type === 'heading'"
      class="i-md__heading"
    ><MdInline :nodes="block.children" /></component>

    <p v-else-if="block.type === 'paragraph'" class="i-md__p"><MdInline :nodes="block.children" /></p>

    <!-- 还没收完的代码块不给复制按钮：复制到一半的代码比不给复制更坑 -->
    <ICodeBlock
      v-else-if="block.type === 'code'"
      :code="block.text"
      :lang="block.lang || undefined"
      :copyable="!block.open"
    />

    <blockquote v-else-if="block.type === 'quote'" class="i-md__quote">
      <_MdBlocks :blocks="block.children" />
    </blockquote>

    <ol v-else-if="block.type === 'list' && block.ordered" class="i-md__list" :start="block.start">
      <li v-for="(item, i) in block.items" :key="i"><_MdBlocks :blocks="item" /></li>
    </ol>
    <ul v-else-if="block.type === 'list'" class="i-md__list">
      <li v-for="(item, i) in block.items" :key="i"><_MdBlocks :blocks="item" /></li>
    </ul>

    <!-- 表格自己横向滚动：让整页能左右拖比表格里滚更糟 -->
    <div v-else-if="block.type === 'table'" class="i-md__table-wrap">
      <table class="i-md__table">
        <thead>
          <tr>
            <th v-for="(cell, c) in block.head" :key="c" :style="{ textAlign: block.align[c] ?? undefined }">
              <MdInline :nodes="cell" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in block.rows" :key="r">
            <td v-for="(cell, c) in row" :key="c" :style="{ textAlign: block.align[c] ?? undefined }">
              <MdInline :nodes="cell" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <hr v-else-if="block.type === 'hr'" class="i-md__hr" />
  </template>
</template>
