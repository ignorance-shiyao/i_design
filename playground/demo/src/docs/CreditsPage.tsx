import { CodeBlock, Table, Tag } from '@i-design/react';

interface Credit {
  source: string;
  idea: string;
  where: string;
  note: string;
}

/**
 * Honest attribution. Every row is something concretely adopted, not a vague
 * "inspired by" — and where the value came from published source or spec, that
 * is stated rather than paraphrased from memory.
 */
const CREDITS: Credit[] = [
  {
    source: 'Semi Design',
    idea: 'RGB 三元组 + alpha 的两层令牌',
    where: '@i-design/tokens',
    note: '读自其 semi-theme-default 源码：语义令牌写成 rgba(var(--semi-grey-9), .62)。一个色相派生出文字层级、描边与填充，换肤只换三元组。',
  },
  {
    source: 'Semi Design',
    idea: '圆角 3 / 6 / 12，控件高 24 / 32 / 40',
    where: 'shape.ts',
    note: '同样来自其源码的 $height-control-* 与 --semi-border-radius-*。密集界面里，大圆角会显得臃肿。',
  },
  {
    source: 'Carbon (IBM)',
    idea: 'productive / expressive 双缓动体系',
    where: '--i-ease-*',
    note: '曲线取自 carbon/packages/motion 的源码：常用操作用 productive（不该让人等），需要被注意的瞬间用 expressive。',
  },
  {
    source: 'Material Design',
    idea: '状态层（state layer）',
    where: '.i-state / --i-state-*',
    note: '不为每个变体挑 hover 色，而是用内容色按固定不透明度叠一层。白底按钮、品牌色按钮、菜单行的按压手感因此一致。',
  },
  {
    source: 'Ant Design',
    idea: 'Result / Descriptions / Statistic / Watermark',
    where: '数据展示、反馈',
    note: '这几个是 Ant 生态里被验证过的后台零件形态；Watermark 用 canvas 平铺而不是堆 DOM 节点。',
  },
  {
    source: 'Element Plus',
    idea: 'InputNumber 的两端加减、Slider 刻度、Timeline',
    where: 'controls="side"',
    note: 'Ant 的上下箭头（stack）与 Element 的两端加减（side）各有场景，所以两种都提供。',
  },
  {
    source: 'TDesign',
    idea: '命令式插件式 API',
    where: 'message / notification',
    note: '通知不是组件而是一个普通函数，React、Vue、原生脚本调用同一份实现。',
  },
  {
    source: 'Radix / Headless UI',
    idea: '无头行为与组件外观分离',
    where: '@i-design/core',
    note: '行为、ARIA、键盘交互与渲染解耦——但我们在 headless 之上还给了一套完整的默认视觉。',
  },
  {
    source: 'WAI-ARIA APG',
    idea: 'roving tabindex、combobox、tree 的键盘模型',
    where: 'useRoving / useSelect / useTree',
    note: '一组控件只占一个 Tab 停靠点、方向键在组内移动，是规范而不是发明。',
  },
];

export function CreditsPage() {
  return (
    <>
      <div className="page__head">
        <h1 className="page__title">各家所长</h1>
        <p className="page__lede">
          这套库不装作凭空长出来。下面每一行都是具体采纳的东西——能读到源码或规范的，就以源码为准，
          而不是凭印象复述。视觉身份（品牌色、字体、图标）是自己的，借鉴的是结构与规范。
        </p>
      </div>

      <section className="section" id="credits">
        <h2 className="section__title">采纳清单</h2>
        <Table
          size="s"
          rowKey={(row) => `${row.source}-${row.idea}`}
          columns={[
            { key: 'source', title: '来源', width: 130 },
            { key: 'idea', title: '采纳了什么', width: 220 },
            { key: 'where', title: '落在哪里', width: 150 },
            { key: 'note', title: '说明' },
          ]}
          data={CREDITS as unknown as Record<string, unknown>[]}
          renderCell={(column, row) =>
            column.key === 'source' ? <Tag size="s">{String(row.source)}</Tag>
            : column.key === 'where' ? <code>{String(row.where)}</code>
            : undefined
          }
        />
      </section>

      <section className="section" id="not-copied">
        <h2 className="section__title">没有照搬的部分</h2>
        <ul className="bullets">
          <li>色板是自己调的：钴蓝带一点紫调，10 阶按感知间距手工排布，不是从某家拷来的十六进制。</li>
          <li>语法高亮没有引入 highlight.js 或 Prism，而是写了约 120 行的分词器，保住零运行时依赖。</li>
          <li>定位、焦点锁、动效状态机都是自带实现，不依赖 floating-ui 或 framer-motion。</li>
          <li>跨框架一致性测试是这套库自己的约束，据我所知没有哪家组件库把「两个框架产出同样 DOM」写成测试。</li>
        </ul>
      </section>

      <section className="section" id="state-layer">
        <h2 className="section__title">状态层是怎么工作的</h2>
        <p className="section__desc">
          传统做法是给每个变体挑一个 hover 色，变体一多就会漂移。状态层的做法是叠一层内容色，
          不透明度由令牌统一给定，因此白底按钮、品牌色按钮和菜单行的按压反馈是同一种手感。
        </p>
        <CodeBlock
          language="css"
          code={`.i-state::after {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;   /* 用内容色，不是另挑一个色 */
  opacity: 0;
}
.i-state:hover::after  { opacity: var(--i-state-hover); }   /* 0.06 */
.i-state:active::after { opacity: var(--i-state-pressed); } /* 0.12 */`}
        />
      </section>
    </>
  );
}

export const CREDITS_ANCHORS = [
  { id: 'credits', label: '采纳清单' },
  { id: 'not-copied', label: '没有照搬的部分' },
  { id: 'state-layer', label: '状态层' },
];
