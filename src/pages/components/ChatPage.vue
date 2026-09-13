<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import IChatMessage from '@/components/IChatMessage.vue'
import IChatTyping from '@/components/IChatTyping.vue'
import IChatThinking from '@/components/IChatThinking.vue'
import IChatToolCall from '@/components/IChatToolCall.vue'
import IToolChips from '@/components/IToolChips.vue'
import IInsightCards from '@/components/IInsightCards.vue'
import ISelectionActions from '@/components/ISelectionActions.vue'
import IChatSources from '@/components/IChatSources.vue'
import IChatSuggestions from '@/components/IChatSuggestions.vue'
import IPromptInput from '@/components/IPromptInput.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import { snippets } from '@/data/snippets'
import type { AgentTask, ApprovalQuestion, ContextChunk, DiffRow, InsightItem } from '@i-design/common'
import IApprovalCard from '@/components/IApprovalCard.vue'
import IAgentTasks from '@/components/IAgentTasks.vue'
import IRecommendCard from '@/components/IRecommendCard.vue'
import IContextCards from '@/components/IContextCards.vue'
import IDiffTable from '@/components/IDiffTable.vue'
import ISegmented from '@/components/ISegmented.vue'
import ITag from '@/components/ITag.vue'

/* 一段可以真的跑起来的模拟会话：逐字输出、可中断、可重发 */
interface Turn {
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

const answer =
  '分页的页码序列由公共层的 buildPages 计算：首尾页恒在，中间窗口跟随当前页滑动，' +
  '断开处用省略号占位。各端引用同一份实现，因此同一组参数在任意一端都会得到同样的序列。'

const turns = ref<Turn[]>([
  { role: 'user', text: '分页组件的省略号是怎么算的？' },
  { role: 'assistant', text: answer }
])

const list = ref<HTMLElement | null>(null)

/**
 * 新内容出现时跟随到底部——但只在用户本来就贴着底部时。
 * 用户往回翻看历史时把他拽回底部，是聊天界面最惹人烦的行为之一。
 */
async function follow() {
  const el = list.value
  if (!el) return
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  if (!atBottom) return
  await nextTick()
  el.scrollTop = el.scrollHeight
}

const draft = ref('')
const generating = ref(false)
const waiting = ref(false)
let timer: number | undefined

function stop() {
  window.clearInterval(timer)
  generating.value = false
  waiting.value = false
  const last = turns.value[turns.value.length - 1]
  if (last?.role === 'assistant') last.streaming = false
}

function send(text: string) {
  if (generating.value) return
  turns.value.push({ role: 'user', text })
  draft.value = ''
  waiting.value = true
  generating.value = true
  follow()

  // 先等一拍再出字，模拟真实的首字延迟——三点提示正是为这段空窗准备的
  window.setTimeout(() => {
    waiting.value = false
    const reply: Turn = { role: 'assistant', text: '', streaming: true }
    turns.value.push(reply)
    let i = 0
    timer = window.setInterval(() => {
      reply.text = answer.slice(0, ++i)
      follow()
      if (i >= answer.length) stop()
    }, 24)
  }, 700)
}

watch(() => turns.value.length, follow)

const suggestions = ['maxVisible 怎么设？', '小程序端也一样吗？', 'Flutter 端怎么验证一致性？']

const sources = [
  { title: 'packages/common/src/logic/pagination.ts', url: undefined },
  { title: 'Pagination 分页 · 组件文档', url: '#/components/pagination' }
]

function copy(text: string) {
  navigator.clipboard?.writeText(text)
  message.success('已复制')
}

/* ---------- 智能体交互的示例数据 ---------- */
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
const sourceOptions = [
  { label: 'pagination.ts', description: 'packages/common/src/logic', keywords: ['分页'] },
  { label: 'table.ts', description: 'packages/common/src/logic', keywords: ['表格'] },
  { label: '设计令牌', description: 'docs/design/tokens', keywords: ['token'] },
  { label: '覆盖矩阵', description: 'docs/SOURCE_STATUS.md', keywords: ['matrix'] }
]
const commandOptions = [
  { label: 'explain', description: '解释选中的这段代码' },
  { label: 'test', description: '给这个函数补一组边界用例' },
  { label: 'review', description: '按仓库约定评审这次改动' }
]
const draft2 = ref('')

const thinkingSteps = [
  { key: 'a', title: '拆解问题：分页规则该放在哪一层', kind: 'reason' as const, status: 'done' as const, detail: '写在组件里的话，各端会各写一份，翻页边界迟早对不上。' },
  { key: 'b', title: '检索仓库里已有的实现', kind: 'search' as const, status: 'done' as const, detail: 'packages/common/src/logic/pagination.ts：buildPages / clampPage / pageCountOf，各端共用。' },
  { key: 'c', title: '补一条省略号的边界用例', kind: 'code' as const, status: 'running' as const, detail: '总页数正好等于窗口宽度时，两端都不该出现省略号。' },
  { key: 'd', title: '跑跨端一致性校验', kind: 'tool' as const, status: 'done' as const }
]

const chips = [
  { key: 'a', label: 'App.tsx', status: 'success' as const, added: 74, removed: 41 },
  { key: 'b', label: 'flavors.css', status: 'success' as const, added: 13 },
  { key: 'c', label: 'grep', status: 'running' as const },
  { key: 'd', label: 'run_tests', status: 'error' as const },
  { key: 'e', label: 'tokens.json', status: 'success' as const, added: 2, removed: 2 },
  { key: 'f', label: 'README.md', status: 'success' as const, added: 8 }
]
const chipsExpanded = ref(false)

/* 一组洞察。序列短是有意的：洞察卡看的是一段时间的走向，不是完整的时序图 */
const insights: InsightItem[] = [
  {
    id: 'conv',
    title: '下单转化率',
    summary: '周二跌到谷底后连续两天回升，周四已高于周一。谷底与一次结算超时告警同一天。',
    series: [12, 9, 11, 15],
    labels: ['周一', '周二', '周三', '周四'],
    unit: '%'
  },
  {
    id: 'ttfb',
    title: '首字节时延',
    summary: '中位数稳定在 120ms 上下，波动来自周三的一次灰度发布，已回落。',
    series: [118, 121, 164, 119, 117],
    labels: ['周一', '周二', '周三', '周四', '周五'],
    unit: 'ms'
  },
  {
    id: 'retry',
    title: '重试次数',
    summary: '整周持平。重试集中在同一个下游接口，值得单独看它的超时设置。',
    series: [34, 34, 34, 34],
    labels: ['周一', '周二', '周三', '周四'],
    unit: '次'
  }
]
const insightIndex = ref(0)

/* 选区动作。id 由调用方分派，组件不关心「改写」到底怎么改 */
const selectionActions = [
  { id: 'rewrite', label: '改写', icon: 'sparkle' as const },
  { id: 'shorten', label: '缩短', icon: 'minus' as const },
  { id: 'explain', label: '解释', icon: 'help-circle' as const }
]
const lastSelection = ref('')
function onSelectionAction(payload: { action: { label: string }; text: string }) {
  lastSelection.value = `${payload.action.label}：${payload.text}`
}
</script>

<template>
  <article>
    <h1>AI 会话与智能体</h1>
    <p class="i-lead">
      面向 AI 场景的一组组件：从一问一答的会话，到智能体替你做事时的征求确认、进度汇报与成批改动。它们共用同一套令牌与语义色，因此把会话嵌进中后台页面时不会像贴了一块外来的皮肤。
    </p>

    <DemoBlock
      title="一次完整的会话"
      description="可以直接输入试试：发送后先出现等待提示，再逐字输出，过程中可以中断。"
    >
      <div class="chat">
        <div ref="list" class="chat__list">
          <IChatMessage
            v-for="(turn, index) in turns"
            :key="index"
            :role="turn.role"
            :name="turn.role === 'user' ? '我' : 'Ignorance 助手'"
            :streaming="turn.streaming"
            @copy="copy(turn.text)"
            @retry="send(turns[index - 1]?.text ?? '')"
          >
            {{ turn.text }}
            <template v-if="turn.role === 'assistant' && !turn.streaming" #after>
              <IChatSources :sources="sources" />
              <IChatSuggestions :items="suggestions" @select="send" />
            </template>
          </IChatMessage>

          <IChatMessage v-if="waiting" role="assistant" name="Ignorance 助手">
            <IChatTyping />
          </IChatMessage>
        </div>

        <IPromptInput
          v-model="draft"
          :generating="generating"
          :max-length="2000"
          hint="Enter 发送，Shift + Enter 换行"
          @submit="send"
          @stop="stop"
          @attach="message.info('附件选择交给宿主应用实现')"
        />
      </div>
    </DemoBlock>

    <p class="i-note">
      这组组件同样是多端齐备的：Vue 3 / Vue 2 / React / 小程序 / 移动两端 / Flutter，共用同一份样式与语义色。下面每个示例的「查看代码」里都能切换到对应端的写法，片段里的属性名由校验脚本与各端实现逐个核对。
    </p>

    <h2>消息</h2>
    <p>
      两个角色的排版刻意不对称：用户消息是右对齐、宽度受限的气泡，助手消息是左对齐的通栏正文。因为二者的阅读量差着数量级——把几百字的回答塞进气泡里，行长会被压到难以阅读。
    </p>
    <DemoBlock
      title="角色与状态"
      description="复制、重新生成这类操作默认隐藏，悬停消息时才浮现；生成过程中不出现，因为此时复制到的是半截内容。"
      :snippets="snippets.chatMessage"
    >
      <div class="chat chat--plain">
        <IChatMessage role="user" name="我" time="14:03">帮我把这段配置改成按环境区分</IChatMessage>
        <IChatMessage name="Ignorance 助手" :streaming="true">好的，我先看一下现有结构</IChatMessage>
        <IChatMessage name="Ignorance 助手" :error="true">生成失败：上游服务超时，请重试。</IChatMessage>
      </div>
    </DemoBlock>

    <h2>推理过程</h2>
    <p>
      默认折叠。推理过程对排查问题很有用，但它不是答案——展开后用更小的字号与次级文字色，让它在视觉上明确从属于回答。
    </p>
    <DemoBlock
      title="思考中与已完成"
      code='<IChatThinking :pending="true" label="正在推理" />
<IChatThinking duration="思考了 12 秒">先确认令牌来源…</IChatThinking>'
    >
      <div class="chat chat--plain">
        <IChatThinking :pending="true" label="正在推理" />
        <IChatThinking duration="思考了 12 秒" :default-open="true">
先确认分页规则写在哪一层：如果写在组件里，各端就会各写一份。查到 packages/common/src/logic/pagination.ts，多端共用同一份实现。
        </IChatThinking>
      </div>
    </DemoBlock>

    <DemoBlock
      title="分步轨迹"
      description="一整段流水账读者只会跳过。拆成步之后，「走到哪一步」与「哪一步出了问题」都摆在面上：折叠时标题上顶着进度，展开后出错与进行中的那几步已经是打开的——它们正是此刻要看的。"
      lang="vue"
      code='<IChatThinking :steps="steps" :default-open="true" duration="思考了 12 秒" />'
    >
      <div class="chat chat--plain">
        <IChatThinking :steps="thinkingSteps" :default-open="true" duration="思考了 12 秒" />
      </div>
    </DemoBlock>

    <h2>工具调用</h2>
    <p>
      状态色沿用体系里既有的语义色，不为 AI 场景另造一套；否则同一个红色在别处表示「删除」、在这里表示「调用失败」，用户要学两遍。失败的调用默认展开，因为这时用户要看的正是错在哪。
    </p>
    <DemoBlock
      title="三种状态"
      code='<IChatToolCall name="search_docs" status="running" summary="正在检索分页相关文档" />
<IChatToolCall name="read_file" status="success" :args="{ path: &apos;logic/pagination.ts&apos; }" :result="{ lines: 42 }" />
<IChatToolCall name="run_tests" status="error" error="超时：120s 内未返回" />'
    >
      <div class="chat chat--plain">
        <IChatToolCall name="search_docs" status="running" summary="正在检索分页相关文档" />
        <IChatToolCall
          name="read_file"
          status="success"
          summary="packages/common/src/logic/pagination.ts"
          :args="{ path: 'packages/common/src/logic/pagination.ts', range: [1, 40] }"
          :result="{ lines: 42, exports: ['buildPages', 'clampPage', 'pageCountOf'] }"
        />
        <IChatToolCall name="run_tests" status="error" summary="npm run check:parity" error="超时：120 秒内未返回结果" />
      </div>
    </DemoBlock>

    <h2>芯片与卡片</h2>
    <p>
      同一次工具调用有两种形态：<strong>芯片是折叠态，卡片是展开态</strong>。智能体一次回答里可能调十几次工具，每次都摊成一张卡片，读者要滚三屏才看得到结论；全藏起来又没人知道它动了什么。所以默认给芯片——一行里只留「做了什么」与「动了多少」，点开某一片才换成上面那种完整的卡片。
    </p>
    <DemoBlock
      title="压成一行"
      description="超过 max 片就折叠，按钮上带着被藏起来那部分的统计与失败数——折叠不该等于把信息删掉。状态靠图标形状与文字，颜色只是第三条线索。"
      lang="vue"
      code='<IToolChips :items="chips" :max="4" v-model:expanded="expanded" @select="onSelect" />'
    >
      <IToolChips :items="chips" :max="4" v-model:expanded="chipsExpanded" />
    </DemoBlock>

    <h2>洞察卡</h2>
    <p>
      结论在上、图在下：洞察卡的主角是那句话，图是它的依据。反过来排，读者会先自己解读曲线，等读到结论时已经有了一个判断——两者不一致时他信自己那个，这张卡就白做了。趋势线可以擦洗：一句「周三回升」不给具体数字，读者无从判断这个回升是 2% 还是 20%。指针横向划过即可读数，键盘用左右键，Home / End 跳到两端。
    </p>
    <DemoBlock
      title="翻页与擦洗"
      description="左右翻到下一条洞察，到头就停住而不绕回第一条——绕回去会让人以为还有新的。涨跌同时给出图标与文字，颜色不是唯一线索。"
      lang="vue"
      code='<IInsightCards :items="insights" v-model:index="insightIndex" />'
    >
      <div class="insight-demo">
        <IInsightCards :items="insights" v-model:index="insightIndex" />
      </div>
    </DemoBlock>

    <h2>选区操作</h2>
    <p>
      浮条跟着选区走，而不是放在页面角上：选中一段话之后再把视线挪到别处去找入口，中途很容易碰一下页面把选区清掉，那时用户得重选一遍，而他并不知道自己做错了什么。动作条不代替选择，只承接选择——它不改选区、不阻止继续拖选，按 Esc 或点别处就消失。
    </p>
    <p>
      各端的差别在「怎么选」而不在「选中之后怎么办」。Web 与 Flutter 走系统自己的选字行为（长按起选、拖手柄改范围、双击选词），这个库只替换选完之后弹出来的那排动作——自己造一套选择手柄必然与系统不一致，而用户对选字的肌肉记忆来自系统。小程序没有任何接口能读回用户划到了哪几个字，所以那一端按段落选：长按一段就把整段交给动作条。
    </p>
    <DemoBlock
      title="选中下面这段话试试"
      description="选区的清理、字数上限、引文省略与动作条摆哪边都走公共层：超过上限时给的是一句「选短一些」，而不是一排点不动的灰按钮。"
      lang="vue"
      code='<ISelectionActions :actions="actions" @select="onSelect">
  <p>可以被选中的正文……</p>
</ISelectionActions>'
    >
      <div class="selact-demo">
        <ISelectionActions :actions="selectionActions" @select="onSelectionAction">
          <p class="selact-demo__text">
            智能体在第三步调用了检索工具，拿回四段文档，其中两段与问题无关。它没有说明为什么舍弃那两段，直接进入了下一步。如果这一步的取舍标准能写出来，读者复核起来会快得多。
          </p>
        </ISelectionActions>
        <p v-if="lastSelection" class="hint">收到：{{ lastSelection }}</p>
      </div>
    </DemoBlock>

    <h2>来源与追问</h2>
    <DemoBlock
      title="来源与建议"
      description="来源编号与正文角标一一对应；追问建议放在回答之后，它们是对这一轮的延伸。"
      code='<IChatSources :sources="sources" />
<IChatSuggestions :items="items" @select="send" />'
    >
      <div class="chat chat--plain">
        <IChatSources :sources="sources" />
        <IChatSuggestions :items="suggestions" @select="() => {}" />
      </div>
    </DemoBlock>

    <h2>输入台</h2>
    <p>
      与普通多行文本框的差别在于它是一个操作台：文本随内容增高但有上限，附件、计数、发送与停止排在同一个框里。停止按钮占据发送按钮的位置，用户不必去别处找中断入口。
    </p>
    <DemoBlock
      title="输入台"
      description="回车发送、Shift + 回车换行；输入法组字过程中的回车是确认候选词，不会误发。附件按文件类型给出图标与配色。"
      :snippets="snippets.promptInput"
    >
      <div class="chat chat--plain">
        <IPromptInput
          v-model="draft"
          :max-length="2000"
          :attachments="[{ name: 'pagination.ts', size: 4210 }]"
          hint="Enter 发送，Shift + Enter 换行"
          @submit="send"
        />
      </div>
    </DemoBlock>

    <DemoBlock
      title="@ 引用与 / 命令"
      description="打一个 @ 引用资料、打一个 / 唤起命令，候选就地弹出，↑↓ 选、回车插入、Esc 收起。候选开着时回车归它用——不这么让的话，用户刚打出「@分页」按回车，发出去的是半截问题。邮箱里的 @ 与词中间的 @ 都不会误弹。"
      lang="vue"
      code='<IPromptInput v-model="draft" :mentions="sources" :commands="commands" @pick="onPick" />'
    >
      <div class="chat chat--plain">
        <IPromptInput
          v-model="draft2"
          :mentions="sourceOptions"
          :commands="commandOptions"
          hint="试试打一个 @ 或 /"
        />
      </div>
    </DemoBlock>

    <h2>智能体交互</h2>
    <p>
      上面几节解决的是「一问一答」。接下来这些解决的是<strong>智能体替你做事</strong>时的沟通：它要在行动前征求同意、要报告进度、要给出带把握程度的建议、要说明它读了哪些资料。
    </p>

    <h2>征求确认</h2>
    <p>
      智能体在有后果的操作前停下来问一句。多个问题时逐题推进，预设选项之外留一个自由输入——不给出口只会逼用户随便选一个，得到的答案反而更不可信。
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
      智能体做事的过程是可见的。状态同时用形状与颜色表达——只靠颜色的话，灰绿两色在灰度打印与色觉障碍下分不出来。
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
      智能体主动提出的建议，附带它对这个建议的把握程度。置信度分三档而不是显示百分比——模型给出的 0.73 并不比 0.71 更可信，显示成精确数字会让人过度解读。
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
        <label
          style="
            font-size: var(--i-font-size-sm);
            color: var(--i-color-text-secondary);
          "
        >
          置信度 {{ confidence.toFixed(2) }}
          <input v-model.number="confidence" type="range" min="0" max="1" step="0.05" style="width: 100%" />
        </label>
      </div>
    </DemoBlock>
    <h2>上下文卡</h2>
    <p>
      智能体回答时读了哪些资料。标出字符数而不是 token 数——token 是模型的内部单位，同一段文字在不同模型下数值不同，用户无从判断这个数字意味着什么。
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
      智能体提出的成批表格改动，逐行可取消。未变的行也留着当上下文，让人看清改动落在哪里，但不计入「共 N 处改动」——否则数字大得没有意义。
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

    <h2>属性</h2>
    <table class="i-table">
      <thead>
        <tr><th>组件</th><th>关键属性</th><th>事件</th></tr>
      </thead>
      <tbody>
        <tr><td>IChatMessage</td><td>role、name、time、streaming、error</td><td>copy、retry</td></tr>
        <tr><td>IChatThinking</td><td>label、duration、pending、defaultOpen、steps</td><td>—</td></tr>
        <tr><td>IChatToolCall</td><td>name、summary、status、args、result、error</td><td>—</td></tr>
        <tr><td>IToolChips</td><td>items、max、expanded</td><td>select、update:expanded</td></tr>
        <tr><td>IInsightCards</td><td>items、index</td><td>update:index</td></tr>
        <tr><td>ISelectionActions</td><td>actions、max</td><td>select</td></tr>
        <tr><td>IChatSources</td><td>sources</td><td>—</td></tr>
        <tr><td>IChatSuggestions</td><td>items、title</td><td>select</td></tr>
        <tr><td>IPromptInput</td><td>modelValue、generating、maxLength、attachments、hint、submitOnEnter、mentions、commands</td><td>submit、stop、attach、removeAttachment、pick</td></tr>
        <tr><td>IApprovalCard</td><td>questions、confirmText、skipText、closable</td><td>complete、close</td></tr>
        <tr><td>IAgentTasks</td><td>tasks、variant、showSummary</td><td>select</td></tr>
        <tr><td>IRecommendCard</td><td>title、confidence、acceptText、alternativeText、showAlternative</td><td>accept、alternative</td></tr>
        <tr><td>IContextCards</td><td>chunks、title、previewLimit</td><td>—</td></tr>
        <tr><td>IDiffTable</td><td>title、columns、rows</td><td>apply</td></tr>
      </tbody>
    </table>
    <h2>什么时候不该用它</h2>
    <ul>
      <li>交互是一次性的表单式问答时——直接给表单，对话的来回会把三个字段问成三轮。</li>
      <li>结果是结构化数据（一张表、一份报告）时——用对应的展示组件，把表格塞进气泡里行长会被压垮。</li>
      <li>智能体的动作有后果时——不要只在正文里说一句「我已经删了」，用征求确认让人在动手前拦下来。</li>
    </ul>
  </article>
</template>

<style scoped>
/* 洞察卡不该撑满整行：那句结论一行放不到 80 个字才读得顺 */
.insight-demo { max-width: 420px; }
.selact-demo { display: flex; flex-direction: column; gap: var(--i-spacing-2); max-width: 560px; }
.selact-demo__text { margin: 0; line-height: 1.8; }
.chat {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-4);
  width: 100%;
}
.chat__list {
  display: flex;
  flex-direction: column;
  max-height: 420px;
  overflow-y: auto;
  padding-right: var(--i-spacing-2);
}
.chat--plain { gap: var(--i-spacing-3); }
</style>
