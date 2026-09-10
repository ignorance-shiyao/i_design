<script setup lang="ts">
import { ref } from 'vue'
import IApprovalCard from '@/components/IApprovalCard.vue'
import IAgentTasks from '@/components/IAgentTasks.vue'
import IRecommendCard from '@/components/IRecommendCard.vue'
import IContextCards from '@/components/IContextCards.vue'
import IDiffTable from '@/components/IDiffTable.vue'
import ISegmented from '@/components/ISegmented.vue'
import ITag from '@/components/ITag.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import type { AgentTask, ApprovalQuestion, ContextChunk, DiffRow } from '@i-design/common'

const questions: ApprovalQuestion[] = [
  {
    id: 'count',
    title: '这次要上线几个口味？',
    options: [
      { value: 'three', label: '三个', hint: '核心线' },
      { value: 'five', label: '五个', hint: '整箱' },
      { value: 'one', label: '只做一个主打' }
    ],
    allowCustom: true,
    customPlaceholder: '其他方案……'
  },
  {
    id: 'channel',
    title: '优先铺哪些渠道？',
    options: [
      { value: 'store', label: '门店' },
      { value: 'online', label: '线上' },
      { value: 'wholesale', label: '批发' }
    ],
    multiple: true,
    skippable: true
  }
]

const tasks = ref<AgentTask[]>([
  { id: '1', title: '核对供应商资料', status: 'completed', meta: '12 家', detail: '其中 2 家的冷链认证已过期，已标记待更新。' },
  { id: '2', title: '生成补货清单', status: 'running', step: 2, meta: '7 个 SKU' },
  { id: '3', title: '起草供应商邮件', status: 'pending', step: 3 },
  { id: '4', title: '同步到 ERP', status: 'failed', meta: '连接超时', detail: '上游服务连续三次超时，本次同步已中止。' }
])
const variant = ref<'capsule' | 'list'>('capsule')
const confidence = ref(0.85)

const chunks: ContextChunk[] = [
  {
    id: 'c1',
    title: '供应商准入规则',
    content: '新增乳制品供应商前必须核验冷链认证，认证有效期不足 30 天的一律不予接入。',
    source: '供应商准入规范.pdf',
    href: '#'
  },
  {
    id: 'c2',
    title: '季节性需求表',
    content:
      '第四季度动销：开心果 +18%、香草 +6%、石板街 −11%、黑芝麻 +24%、抹茶 −3%。周动销低于 40 桶的口味进入淘汰观察期，连续两个月未回升则下架。淘汰前需通知门店备货，避免出现菜单已改而库存未清的情况。历史数据显示，提前两周通知可以把滞销损耗压到 3% 以内；不通知的情况下，平均损耗为 11%。区域差异也需考虑：南方门店的当季口味动销普遍高出北方 6 到 9 个百分点，淘汰判定应按区域分别计算，不宜一刀切。',
    source: '动销明细.csv'
  }
]

const columns = [
  { key: 'flavor', label: '口味' },
  { key: 'category', label: '分类' },
  { key: 'supplier', label: '供应商' }
]

const diffRows: DiffRow[] = [
  {
    id: 'r1',
    kind: 'removed',
    cells: { flavor: { value: '石板街' }, category: { value: '经典' }, supplier: { value: '晨光牧场' } }
  },
  {
    id: 'r2',
    kind: 'removed',
    cells: { flavor: { value: '泡泡糖' }, category: { value: '复古' }, supplier: { value: '云顶乳业' } }
  },
  {
    id: 'r3',
    kind: 'unchanged',
    cells: { flavor: { value: '薄荷脆片' }, category: { value: '经典' }, supplier: { value: '枫轨农场' } }
  },
  {
    id: 'r4',
    kind: 'changed',
    cells: {
      flavor: { value: '开心果' },
      category: { value: '当季', before: '经典' },
      supplier: { value: '枫轨农场' }
    }
  },
  {
    id: 'r5',
    kind: 'added',
    cells: { flavor: { value: '黑芝麻' }, category: { value: '当季' }, supplier: { value: '南岭食品' } }
  }
]
</script>

<template>
  <article>
    <h1>智能体交互</h1>
    <p class="i-lead">
      对话组件解决的是「一问一答」。这一组解决的是<strong>智能体替你做事</strong>时的沟通：
      它要在行动前征求同意、要报告进度、要给出带把握程度的建议。
    </p>

    <h2>征求确认</h2>
    <p>
      智能体在有后果的操作前停下来问一句。多个问题时逐题推进，
      预设选项之外留一个自由输入——不给出口只会逼用户随便选一个，
      得到的答案反而更不可信。
    </p>
    <DemoBlock
      title="逐题确认"
      description="有自由输入时，填了文字也算已回答；否则用户写完「其他」却发现继续按钮仍是灰的，只能回头点一个不想选的选项。第二题可跳过。"
      lang="vue"
      code='<IApprovalCard :questions="questions" @complete="onComplete" />'
    >
      <IApprovalCard
        :questions="questions"
        style="max-width: 420px"
        @complete="(a) => message.success(`已记录 ${Object.keys(a).length} 项回答`)"
        @close="() => message.info('已关闭')"
      />
    </DemoBlock>

    <h2>任务行</h2>
    <p>
      智能体做事的过程是可见的。状态同时用形状与颜色表达——只靠颜色的话，
      灰绿两色在灰度打印与色觉障碍下分不出来。
    </p>
    <DemoBlock
      title="进行中 / 完成 / 失败"
      description="底部的完成计数把失败也算作「已结束」，否则一个永远失败的任务会让进度卡住不动，用户以为还在跑。有细节的行可以展开。"
      lang="vue"
      code='<IAgentTasks :tasks="tasks" variant="capsule" />'
    >
      <div style="display: grid; gap: 16px; max-width: 520px">
        <ISegmented
          v-model="variant"
          :options="[
            { value: 'capsule', label: '胶囊' },
            { value: 'list', label: '列表' }
          ]"
        />
        <IAgentTasks :tasks="tasks" :variant="variant" />
      </div>
    </DemoBlock>

    <h2>建议卡</h2>
    <p>
      智能体主动提出的建议，附带它对这个建议的把握程度。置信度分三档而不是显示百分比——
      模型给出的 0.73 并不比 0.71 更可信，显示成精确数字会让人过度解读。
    </p>
    <DemoBlock
      title="带置信度的建议"
      description="三格是视觉线索，旁边的文字才是主要表达。拖动下面的滑块可以看到分档变化。"
      lang="vue"
      code='<IRecommendCard title="要我下这笔补货单吗？" :confidence="0.85" @accept="apply" />'
    >
      <div style="display: grid; gap: 16px; max-width: 460px">
        <IRecommendCard
          title="要我下这笔补货单吗？"
          :confidence="confidence"
          @accept="() => message.success('已下单')"
          @alternative="() => message.info('换一个方案')"
        >
          向 <ITag>锥王食品</ITag> 补货蛋卷筒，预计到货周期
          <ITag type="warning">7 天</ITag>。
        </IRecommendCard>
        <label style="font-size: 13px; color: var(--i-color-text-secondary)">
          置信度 {{ confidence.toFixed(2) }}
          <input v-model.number="confidence" type="range" min="0" max="1" step="0.05" style="width: 100%" />
        </label>
      </div>
    </DemoBlock>
    <h2>上下文卡</h2>
    <p>
      智能体回答时读了哪些资料。标出字符数而不是 token 数——token 是模型的内部单位，
      同一段文字在不同模型下数值不同，用户无从判断这个数字意味着什么。
    </p>
    <DemoBlock
      title="检索片段与出处"
      description="超长片段折叠，可展开全文。出处按文件类型给图标与配色——读者看完片段最常问的下一个问题就是「这句话哪儿来的」。"
      lang="vue"
      code='<IContextCards :chunks="chunks" />'
    >
      <IContextCards :chunks="chunks" style="max-width: 520px" />
    </DemoBlock>

    <h2>差异表</h2>
    <p>
      智能体提出的成批表格改动，逐行可取消。未变的行也留着当上下文，
      让人看清改动落在哪里，但不计入「共 N 处改动」——否则数字大得没有意义。
    </p>
    <DemoBlock
      title="逐行采纳"
      description="默认全选：智能体给的是一整套方案，逐个勾选反而是例外。改动类型用符号加淡底双重表达，只用红绿底色的话，色觉障碍用户看到的是两块一样的灰。"
      lang="vue"
      code='<IDiffTable :columns="columns" :rows="diffRows" @apply="onApply" />'
    >
      <IDiffTable
        :columns="columns"
        :rows="diffRows"
        style="max-width: 620px"
        @apply="(ids) => message.success(`已应用 ${ids.length} 处改动`)"
      />
    </DemoBlock>
  </article>
</template>
