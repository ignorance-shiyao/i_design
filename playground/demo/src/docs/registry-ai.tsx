import { useEffect, useRef, useState } from 'react';
import {
  Chat, ChatAction, ChatMessage, CodeBlock, PromptInput, Suggestions, ThinkingBlock,
  TypingIndicator, createStreamController, message as toast,
} from '@i-design/react';
import type { DocEntry } from './types.js';

interface Turn {
  id: number;
  role: 'user' | 'assistant' | 'system';
  text: string;
  status?: 'streaming' | 'complete' | 'error';
}

const ANSWER = `i-design 的做法是把行为写在 core 里：状态、类名、ARIA 都由一份代码算出来，React 和 Vue 只做属性翻译。

所以同样的 props 一定产出同样的 DOM——这条不是口号，是被 96 个测试钉住的约束。`;

/** A miniature conversation that streams a canned answer — no network involved. */
function ChatDemo() {
  const [turns, setTurns] = useState<Turn[]>([
    { id: 1, role: 'system', text: '示例会话 · 回答为本地模拟' },
    { id: 2, role: 'user', text: '这套组件库怎么保证 React 和 Vue 表现一致？' },
  ]);
  const [busy, setBusy] = useState(false);
  const stream = useRef<ReturnType<typeof createStreamController> | null>(null);

  const answer = (question: string): void => {
    const userTurn: Turn = { id: Date.now(), role: 'user', text: question };
    const replyId = Date.now() + 1;
    setTurns((prev) => [...prev, userTurn, { id: replyId, role: 'assistant', text: '', status: 'streaming' }]);
    setBusy(true);

    stream.current = createStreamController({
      charsPerTick: 2,
      onUpdate: (text) =>
        setTurns((prev) => prev.map((turn) => (turn.id === replyId ? { ...turn, text } : turn))),
      onDone: () => {
        setTurns((prev) => prev.map((turn) => (turn.id === replyId ? { ...turn, status: 'complete' } : turn)));
        setBusy(false);
      },
    });
    stream.current.push(ANSWER);
    stream.current.end();
  };

  useEffect(() => () => stream.current?.stop(), []);

  return (
    <div className="chat-demo">
      <Chat
        scrollKey={turns.map((turn) => turn.text.length).join()}
        footer={
          <>
            {turns.length <= 2 && (
              <div style={{ marginBlockEnd: 12 }}>
                <Suggestions
                  items={['解释一下 roving tabindex', '如何做主题定制？', '写一个表单校验示例']}
                  onPick={answer}
                />
              </div>
            )}
            <PromptInput
              placeholder="发消息…（Enter 发送，Shift+Enter 换行）"
              busy={busy}
              hint={<span style={{ fontSize: 12, color: 'var(--i-color-text-tertiary)' }}>输入法候选期间按 Enter 不会误发</span>}
              onSubmit={answer}
              onStop={() => {
                stream.current?.flush();
                setBusy(false);
              }}
            />
          </>
        }
      >
        {turns.map((turn) => (
          <ChatMessage
            key={turn.id}
            role={turn.role}
            status={turn.status}
            name={turn.role === 'assistant' ? 'i-design 助手' : undefined}
            actions={
              turn.role === 'assistant' && turn.status === 'complete' ? (
                <>
                  <ChatAction label="复制" onClick={() => { void navigator.clipboard?.writeText(turn.text); toast.success('已复制'); }} />
                  <ChatAction label="重新生成" onClick={() => answer('再讲一遍')} />
                </>
              ) : undefined
            }
          >
            {turn.text}
          </ChatMessage>
        ))}
      </Chat>
    </div>
  );
}

function PartsDemo() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ChatMessage role="assistant" name="助手" status="streaming">正在生成回答</ChatMessage>
      <ChatMessage role="assistant" name="助手" status="error">生成失败：上游服务超时，请重试。</ChatMessage>
      <TypingIndicator />
      <ThinkingBlock label="推理过程（12 步）">
        {`1. 解析用户意图：询问跨框架一致性\n2. 检索 core 的 ElementSpec 契约\n3. 组织回答结构`}
      </ThinkingBlock>
      <CodeBlock
        language="tsx"
        code={`const behavior = useButtonBehavior({ status: 'brand', loading });\nreturn <button {...toProps(behavior.root)}>{children}</button>;`}
      />
    </div>
  );
}

export const aiEntries: DocEntry[] = [
  {
    id: 'chat',
    name: 'Chat / PromptInput',
    cn: 'AI 会话',
    category: 'AI 会话',
    description:
      'AI 对话界面里最容易做错的几件事——中文输入法候选期间按 Enter 误发、流式文本一块块跳出来、用户往上翻历史时被强制拉回底部——都在 core 里解决了一次，两端共用。',
    whenToUse: [
      '任何 AI 对话界面：助手、客服、问答、代码生成。',
      '回答是流式返回时，用 createStreamController 把网络分片节流成匀速显示，不要直接把 chunk 塞进 state。',
      '会话很长时依赖内置的滚动跟随：用户往上翻阅读历史，新消息不该把他拽回底部。',
    ],
    demos: [
      {
        caption: '完整会话（流式回答为本地模拟）',
        render: () => <ChatDemo />,
        react: `const stream = useRef<StreamController | null>(null);

const answer = (question: string) => {
  setTurns((prev) => [...prev, userTurn, { id, role: 'assistant', text: '', status: 'streaming' }]);
  stream.current = createStreamController({
    charsPerTick: 2,
    onUpdate: (text) => updateTurn(id, { text }),
    onDone: () => updateTurn(id, { status: 'complete' }),
  });
  // 把网络分片喂进来，显示速度与分片大小解耦
  for await (const chunk of fetchStream(question)) stream.current.push(chunk);
  stream.current.end();
};

<Chat scrollKey={turns.length} footer={<PromptInput busy={busy} onSubmit={answer} onStop={stop} />}>
  {turns.map((turn) => (
    <ChatMessage key={turn.id} role={turn.role} status={turn.status}>
      {turn.text}
    </ChatMessage>
  ))}
</Chat>`,
        vue: `<script setup lang="ts">
import { createStreamController, IChat, IChatMessage, IPromptInput } from '@i-design/vue';

let stream: ReturnType<typeof createStreamController> | null = null;

const answer = async (question: string) => {
  turns.value.push(userTurn, { id, role: 'assistant', text: '', status: 'streaming' });
  stream = createStreamController({
    charsPerTick: 2,
    onUpdate: (text) => updateTurn(id, { text }),
    onDone: () => updateTurn(id, { status: 'complete' }),
  });
  for await (const chunk of fetchStream(question)) stream.push(chunk);
  stream.end();
};
</script>

<template>
  <IChat>
    <IChatMessage v-for="turn in turns" :key="turn.id" :role="turn.role" :status="turn.status">
      {{ turn.text }}
    </IChatMessage>
    <template #footer>
      <IPromptInput :busy="busy" @submit="answer" @stop="stop" />
    </template>
  </IChat>
</template>`,
      },
      {
        caption: '会话零件',
        render: () => <PartsDemo />,
        react: `<ChatMessage role="assistant" status="streaming">正在生成…</ChatMessage>
<TypingIndicator />
<ThinkingBlock label="推理过程（12 步）">{reasoning}</ThinkingBlock>
<CodeBlock language="tsx" code={snippet} />
<Suggestions items={['解释这段代码', '写单元测试']} onPick={ask} />`,
        vue: `<IChatMessage role="assistant" status="streaming">正在生成…</IChatMessage>
<ITypingIndicator />
<IThinkingBlock label="推理过程（12 步）">{{ reasoning }}</IThinkingBlock>
<ICodeBlock language="tsx" :code="snippet" />
<ISuggestions :items="['解释这段代码', '写单元测试']" @pick="ask" />`,
      },
    ],
    props: [
      { name: 'role', type: `'user' | 'assistant' | 'system'`, desc: 'ChatMessage 角色，决定布局与配色' },
      { name: 'status', type: `'sending' | 'streaming' | 'complete' | 'error'`, default: `'complete'`, desc: 'streaming 时显示光标并设为 aria-live 区域' },
      { name: 'busy', type: 'boolean', default: 'false', desc: 'PromptInput：发送键变为停止键' },
      { name: 'minRows / maxRows', type: 'number', default: '1 / 10', desc: 'PromptInput 自动增高的上下界' },
      { name: 'onSubmit / @submit', type: '(value: string) => void', desc: 'Enter 或点击发送时触发，值已 trim' },
      { name: 'createStreamController', type: '({ charsPerTick, onUpdate, onDone })', desc: '把网络分片节流成匀速显示；flush() 立即显示全部' },
      { name: 'isAtBottom', type: '(state) => boolean', desc: '判断是否应继续跟随底部，Chat 内部即用它' },
    ],
  },
];
