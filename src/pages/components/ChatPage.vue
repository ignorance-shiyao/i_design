<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import IChatMessage from '@/components/IChatMessage.vue'
import IChatTyping from '@/components/IChatTyping.vue'
import IChatThinking from '@/components/IChatThinking.vue'
import IChatToolCall from '@/components/IChatToolCall.vue'
import IChatSources from '@/components/IChatSources.vue'
import IChatSuggestions from '@/components/IChatSuggestions.vue'
import IPromptInput from '@/components/IPromptInput.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import { snippets } from '@/data/snippets'

/* 一段可以真的跑起来的模拟会话：逐字输出、可中断、可重发 */
interface Turn {
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

const answer =
  '分页的页码序列由公共层的 buildPages 计算：首尾页恒在，中间窗口跟随当前页滑动，' +
  '断开处用省略号占位。七端引用同一份实现，因此同一组参数在任意一端都会得到同样的序列。'

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
</script>

<template>
  <article>
    <h1>Chat AI 会话</h1>
    <p class="i-lead">
      面向 AI 对话场景的一组组件：消息、推理过程、工具调用、来源、追问建议与输入台。
      它们共用同一套令牌与语义色，因此把会话嵌进中后台页面时不会像贴了一块外来的皮肤。
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
      这组组件同样是七端齐备的：Vue 3 / Vue 2 / React / 小程序 / 移动两端 / Flutter，
      共用同一份样式与语义色。下面每个示例的「查看代码」里都能切换到对应端的写法，
      片段里的属性名由校验脚本与各端实现逐个核对。
    </p>

    <h2>消息</h2>
    <p>
      两个角色的排版刻意不对称：用户消息是右对齐、宽度受限的气泡，助手消息是左对齐的通栏正文。
      因为二者的阅读量差着数量级——把几百字的回答塞进气泡里，行长会被压到难以阅读。
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
      默认折叠。推理过程对排查问题很有用，但它不是答案——展开后用更小的字号与次级文字色，
      让它在视觉上明确从属于回答。
    </p>
    <DemoBlock
      title="思考中与已完成"
      code='<IChatThinking :pending="true" label="正在推理" />
<IChatThinking duration="思考了 12 秒">先确认令牌来源…</IChatThinking>'
    >
      <div class="chat chat--plain">
        <IChatThinking :pending="true" label="正在推理" />
        <IChatThinking duration="思考了 12 秒" :default-open="true">
先确认分页规则写在哪一层：如果写在组件里，各端就会各写一份。
查到 packages/common/src/logic/pagination.ts，七端共用同一份实现。
        </IChatThinking>
      </div>
    </DemoBlock>

    <h2>工具调用</h2>
    <p>
      状态色沿用体系里既有的语义色，不为 AI 场景另造一套；否则同一个红色在别处表示「删除」、
      在这里表示「调用失败」，用户要学两遍。失败的调用默认展开，因为这时用户要看的正是错在哪。
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
      与普通多行文本框的差别在于它是一个操作台：文本随内容增高但有上限，附件、计数、
      发送与停止排在同一个框里。停止按钮占据发送按钮的位置，用户不必去别处找中断入口。
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

    <h2>属性</h2>
    <table class="i-table">
      <thead>
        <tr><th>组件</th><th>关键属性</th><th>事件</th></tr>
      </thead>
      <tbody>
        <tr><td>IChatMessage</td><td>role、name、time、streaming、error</td><td>copy、retry</td></tr>
        <tr><td>IChatThinking</td><td>label、duration、pending、defaultOpen</td><td>—</td></tr>
        <tr><td>IChatToolCall</td><td>name、summary、status、args、result、error</td><td>—</td></tr>
        <tr><td>IChatSources</td><td>sources</td><td>—</td></tr>
        <tr><td>IChatSuggestions</td><td>items、title</td><td>select</td></tr>
        <tr><td>IPromptInput</td><td>modelValue、generating、maxLength、attachments、hint、submitOnEnter</td><td>submit、stop、attach、removeAttachment</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
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
