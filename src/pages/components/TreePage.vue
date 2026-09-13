<script setup lang="ts">
import { ref } from 'vue'
import ITree from '@/components/ITree.vue'
import ITreeSelect from '@/components/ITreeSelect.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import Playground from '@/site/Playground.vue'
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
const picked = ref('')
const pickedMany = ref<string[]>([])

/* 三层、共八千余个节点：不虚拟化的话，展开根节点那一下页面就停住了 */
const bigTree: TreeNode[] = Array.from({ length: 20 }, (_, a) => ({
  key: `a${a}`,
  label: `区域 ${a + 1}`,
  children: Array.from({ length: 20 }, (_, b) => ({
    key: `a${a}b${b}`,
    label: `机房 ${a + 1}-${b + 1}`,
    children: Array.from({ length: 20 }, (_, c) => ({
      key: `a${a}b${b}c${c}`,
      label: `机柜 ${a + 1}-${b + 1}-${c + 1}`
    }))
  }))
}))
const bigExpanded = ref<string[]>(bigTree.flatMap((a) => [a.key, ...(a.children ?? []).map((b) => b.key)]))
const bigChecked = ref<string[]>([])

/* playground 代码片段里固定属性的写法（模板里写会和属性引号打架） */
const treePgCode = [':data="data"']
</script>

<template>
  <article>
    <h1>Tree 树形控件</h1>
    <p class="i-lead">
      层级数据的展开与选择。父子勾选联动、半选态、禁用继承与搜索过滤都由组件负责，调用方只管收结果。
    </p>

    <h2>现场调参</h2>
    <p>下面的控件由源码里的属性类型生成，改动即时生效，代码区给出对应写法。</p>
    <Playground
      name="ITree"
      :is="ITree"
      :fixed="{ data }"
      :fixed-code="treePgCode"
    />

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
    <DemoBlock
      title="长列表"
      description="给了 height 之后，展开的行超过一定条数就只渲染看得见的那十来行，上下用两块空白撑开滚动条。下面这棵树全展开有八千多行，勾选联动与滚动都和几十行时一样跟手。不给 height 就不虚拟化——没有可视高度算不出该渲染哪几行，拿一个猜的高度去算会把行定位到看不见的地方。"
      code='<ITree :data="data" height="320px" checkable v-model:checked="checked" />'
    >
      <div style="width: 420px; max-width: 100%">
        <ITree
          :data="bigTree"
          height="320px"
          checkable
          v-model:checked="bigChecked"
          v-model:expanded="bigExpanded"
        />
        <p class="i-tree-demo-value">已勾选 {{ bigChecked.length }} 项</p>
      </div>
    </DemoBlock>

    <h2>各端差异</h2>
    <p>
      Web 与小程序端自己算窗口，只渲染看得见的那十来行（小程序读不到 <code>offsetHeight</code>，行高用一次测量取得，量不到才退回兜底值）；Flutter 端交给能按需建子项的列表，由框架决定建哪几行，结果一样。三端都是「给了高度才虚拟化」：没有可视高度就算不出该渲染哪几行。
    </p>

    <h2>TreeSelect 树选择</h2>
    <p>
      当层级数据只是「一个字段的候选值」时，整棵树摊在页面上太占地方。树选择把同一棵树收进下拉面板，触发器上显示已选路径。
    </p>

    <DemoBlock
      title="单选"
      description="触发器显示完整路径，用户不必展开也知道选的是哪一层的哪一项。选完即收起。"
      lang="vue"
      code='<ITreeSelect :data="data" v-model="picked" />'
    >
      <div>
        <ITreeSelect :data="data" v-model="picked" />
        <p class="i-tree-demo-value">当前值：{{ picked || '（未选择）' }}</p>
      </div>
    </DemoBlock>

    <DemoBlock
      title="多选"
      description="多选时只展示叶子节点——父节点出现在选中集合里只是「它的子节点都选了」的推论，把它也列出来会让用户以为多选了一项。超过两项折叠为「等 N 项」。多选不自动收起，方便连续勾选。"
      lang="vue"
      code='<ITreeSelect :data="data" multiple v-model:checked="pickedMany" />'
    >
      <div>
        <ITreeSelect :data="data" multiple v-model:checked="pickedMany" />
        <p class="i-tree-demo-value">
          当前值：{{ pickedMany.length ? pickedMany.join('、') : '（未选择）' }}
        </p>
      </div>
    </DemoBlock>
    <h2>什么时候不该用它</h2>
    <ul>
      <li>层级只有两层时——用分组列表，展开收起的开销换不来什么。</li>
      <li>用户是来找某一项而不是理解结构时——先给搜索，让人一层层点开是最慢的找法。</li>
      <li>节点上万且要全展开时——先虚拟化，否则一次展开就是上万个 DOM 节点。</li>
    </ul>
  </article>
</template>

<style scoped>
.i-tree-demo-value {
  margin-top: var(--i-spacing-3);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
</style>
