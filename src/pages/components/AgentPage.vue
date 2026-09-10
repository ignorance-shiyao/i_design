<script setup lang="ts">
import { ref } from 'vue'
import IApprovalCard from '@/components/IApprovalCard.vue'
import IAgentTasks from '@/components/IAgentTasks.vue'
import IRecommendCard from '@/components/IRecommendCard.vue'
import ISegmented from '@/components/ISegmented.vue'
import ITag from '@/components/ITag.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import type { AgentTask, ApprovalQuestion } from '@i-design/common'

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
  </article>
</template>
