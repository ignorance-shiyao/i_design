<script setup lang="ts">
import { ref } from 'vue'
import ITree from '@/components/ITree.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import type { TreeNode } from '@i-design/common'

const data: TreeNode[] = [
  {
    key: 'platform',
    label: '平台',
    children: [
      { key: 'account', label: '账号管理' },
      {
        key: 'auth',
        label: '权限',
        children: [
          { key: 'role', label: '角色' },
          { key: 'policy', label: '策略（只读）', disabled: true }
        ]
      }
    ]
  },
  {
    key: 'billing',
    label: '计费',
    children: [
      { key: 'invoice', label: '账单' },
      { key: 'quota', label: '配额' }
    ]
  },
  { key: 'archive', label: '归档（已停用）', disabled: true, children: [{ key: 'old', label: '历史数据' }] }
]

const checked = ref<string[]>([])
const expanded = ref<string[]>(['platform', 'auth'])
const selected = ref('account')
</script>

<template>
  <article>
    <h1>Tree 树形控件</h1>
    <p class="i-lead">
      层级数据的展开与选择。父子勾选联动、半选态、禁用继承与搜索过滤都由组件负责，
      调用方只管收结果。
    </p>

    <DemoBlock
      title="单选"
      description="不显示复选框时，点击行即为选中。适合「从层级里挑一个」的场景，比如选择目录。"
      lang="vue"
      code='<ITree :data="data" v-model:selected="selected" v-model:expanded="expanded" />'
    >
      <ITree
        :data="data"
        v-model:selected="selected"
        v-model:expanded="expanded"
        style="max-width: 320px"
      />
    </DemoBlock>

    <DemoBlock
      title="多选与半选"
      description="勾选父节点会带上全部可选子节点；只勾一部分时父节点显示为半选。注意「策略（只读）」是禁用的——它不会被父节点带上，但也不会因此拖住父节点，勾「权限」依然能变成完全选中。"
      lang="vue"
      code='<ITree :data="data" checkable v-model:checked="checked" />'
    >
      <div>
        <ITree :data="data" checkable v-model:checked="checked" v-model:expanded="expanded" style="max-width: 320px" />
        <p class="i-tree-demo-value">当前选中：{{ checked.length ? checked.join('、') : '（无）' }}</p>
      </div>
    </DemoBlock>

    <DemoBlock
      title="搜索"
      description="命中节点的祖先会一并保留并自动展开——否则命中项因为父节点被过滤掉而无处挂载，结果是「搜得到却看不见」。清空关键字后回到你原来的展开状态，而不是全部收起。"
      lang="vue"
      code='<ITree :data="data" searchable checkable v-model:checked="checked" />'
    >
      <ITree :data="data" searchable checkable v-model:checked="checked" style="max-width: 320px" />
    </DemoBlock>
  </article>
</template>

<style scoped>
.i-tree-demo-value {
  margin-top: var(--i-spacing-3);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
</style>
