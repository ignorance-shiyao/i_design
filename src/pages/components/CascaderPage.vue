<script setup lang="ts">
import { ref } from 'vue'
import ICascader from '@/components/ICascader.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import type { TreeNode } from '@i-design/common'

const data: TreeNode[] = [
  {
    key: 'cn',
    label: '中国',
    children: [
      { key: 'zj', label: '浙江', children: [{ key: 'hz', label: '杭州' }, { key: 'nb', label: '宁波' }] },
      { key: 'js', label: '江苏', children: [{ key: 'nj', label: '南京' }, { key: 'sz', label: '苏州' }] },
      { key: 'tw', label: '待开通地区', disabled: true, children: [{ key: 'x', label: '暂无' }] }
    ]
  },
  {
    key: 'us',
    label: '美国',
    children: [{ key: 'ca', label: '加州', children: [{ key: 'sf', label: '旧金山' }] }]
  }
]

const city = ref('')
const region = ref('')
</script>

<template>
  <article>
    <h1>Cascader 级联选择</h1>
    <p class="i-lead">
      从有层级的数据里逐级选到底。列数由当前选择路径决定——回退到上一列时，右侧的列会一并收起，不会留下与当前选择无关的旧列。
    </p>

    <DemoBlock
      title="基础用法"
      description="默认只有叶子节点算完成选择。试着先选到「浙江 / 杭州」，再回到第二列点「江苏」——第三列会立刻换成江苏的城市，而不是残留杭州。"
      lang="vue"
      code='<ICascader :data="data" v-model="city" />'
    >
      <div>
        <ICascader :data="data" v-model="city" />
        <p class="i-cascader-demo-value">当前值：{{ city || '（未选择）' }}</p>
      </div>
    </DemoBlock>

    <DemoBlock
      title="选中任意一级"
      description="开启 change-on-select 后，中间层级也算一次有效选择。适合「筛选到省即可」这类场景。禁用的分支不可进入。"
      lang="vue"
      code='<ICascader :data="data" v-model="region" change-on-select />'
    >
      <div>
        <ICascader :data="data" v-model="region" change-on-select />
        <p class="i-cascader-demo-value">当前值：{{ region || '（未选择）' }}</p>
      </div>
    </DemoBlock>
  </article>
</template>

<style scoped>
.i-cascader-demo-value {
  margin-top: var(--i-spacing-3);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
</style>
