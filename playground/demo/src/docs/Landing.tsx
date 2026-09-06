import { useEffect, useRef, useState } from 'react';
import { Button, CodeBlock, Icon, Tag, type IconName } from '@i-design/react';

const FEATURES: Array<{ icon: IconName; title: string; desc: string }> = [
  { icon: 'copy', title: '一份行为，两个框架', desc: '状态、类名、ARIA 都由 core 算出；React 与 Vue 各自只有约 15 行属性翻译。' },
  { icon: 'check-circle', title: '一致性由测试钉住', desc: '同一组 props 分别渲染两端，逐字节比对归一化 DOM——不是口号，是 CI 里的红灯。' },
  { icon: 'star', title: '两层设计令牌', desc: 'RGB 三元组基元 + alpha 组合出语义令牌；换肤只需替换三元组。' },
  { icon: 'user', title: '无障碍是默认值', desc: 'roving tabindex、combobox、tree 的键盘模型按 WAI-ARIA 实现，不是事后补丁。' },
  { icon: 'refresh', title: '动效是状态机', desc: '相位与时序在 core，两端进出场完全同步；折叠动画不需要 JS 测高度。' },
  { icon: 'send', title: 'AI 会话开箱即用', desc: '输入法安全发送、流式匀速显示、滚动跟随——这类界面最容易做错的三件事。' },
];

/** Pointer-driven parallax on the hero. Disabled entirely for reduced motion. */
function useTilt(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;
    const onMove = (event: PointerEvent): void => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: py * -10, y: px * 14 });
    };
    const onLeave = (): void => setTilt({ x: 0, y: 0 });
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  return { ref, tilt };
}

export function Landing({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [motionOk, setMotionOk] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setMotionOk(!query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const { ref, tilt } = useTilt(motionOk);

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />

        <div className="hero__copy">
          <div className="hero__eyebrow">
            <Tag size="s" status="brand">v0.7.0</Tag>
            <span>跨框架组件库 · 62 个组件</span>
          </div>
          <h1 className="hero__title">
            一套设计语言
            <br />
            <span className="hero__accent">同时驱动 React 与 Vue</span>
          </h1>
          <p className="hero__lede">
            设计令牌、样式、交互行为、无障碍语义只写一份，放在 <code>@i-design/core</code>。
            两个框架各自只有一层薄薄的属性翻译——同样的 props，必然产出同样的 DOM。
          </p>
          <div className="hero__actions">
            <Button size="l" status="brand" onClick={() => onNavigate('console')}>
              看控制台示例
              <Icon name="arrow-right" size={16} />
            </Button>
            <Button size="l" variant="outline" onClick={() => onNavigate('button')}>浏览组件</Button>
          </div>
          <div className="hero__meta">
            <span><Icon name="check" size={14} /> 零运行时依赖</span>
            <span><Icon name="check" size={14} /> SSR 安全</span>
            <span><Icon name="check" size={14} /> RTL 与深色</span>
          </div>
        </div>

        {/* The stack is the architecture, drawn in 3D: tokens under core, core
            under the two adapters. Hovering tips it so the layering is legible. */}
        <div className="hero__stage" ref={ref}>
          <div
            className="stack"
            style={{ transform: `rotateX(${18 + tilt.x}deg) rotateZ(${-24 + tilt.y}deg)` }}
          >
            <div className="stack__layer stack__layer--adapters">
              <span className="stack__chip">@i-design/react</span>
              <span className="stack__chip">@i-design/vue</span>
            </div>
            <div className="stack__layer stack__layer--core">
              <span className="stack__label">@i-design/core</span>
              <span className="stack__note">行为 · ARIA · 动效 · 高亮</span>
            </div>
            <div className="stack__layer stack__layer--tokens">
              <span className="stack__label">@i-design/tokens</span>
              <span className="stack__swatches">
                {['--i-brand-5', '--i-green-5', '--i-amber-5', '--i-red-5'].map((token) => (
                  <i key={token} style={{ background: `rgb(var(${token}))` }} />
                ))}
              </span>
            </div>
            <div className="stack__beam" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="band">
        {[
          { value: '62', label: '组件' },
          { value: '2', label: '框架，一份行为' },
          { value: '152', label: '测试全绿' },
          { value: '0', label: '运行时依赖' },
        ].map((item, index) => (
          <div className="band__item" key={item.label} style={{ animationDelay: `${index * 70}ms` }}>
            <div className="band__value">{item.value}</div>
            <div className="band__label">{item.label}</div>
          </div>
        ))}
      </section>

      <section className="features">
        <h2 className="features__title">为什么是这套</h2>
        <div className="features__grid">
          {FEATURES.map((feature, index) => (
            <article className="feature" key={feature.title} style={{ animationDelay: `${index * 60}ms` }}>
              <span className="feature__icon"><Icon name={feature.icon} size={18} /></span>
              <h3 className="feature__title">{feature.title}</h3>
              <p className="feature__desc">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="install">
        <div>
          <h2 className="features__title">五分钟接上</h2>
          <p className="install__desc">
            两个包共用同一份样式与令牌。切换框架时，设计规范与交互细节不需要重新对齐一次。
          </p>
          <div className="install__links">
            <Button variant="text" onClick={() => onNavigate('tokens')}>设计令牌 <Icon name="chevron-right" size={14} /></Button>
            <Button variant="text" onClick={() => onNavigate('credits')}>各家所长 <Icon name="chevron-right" size={14} /></Button>
          </div>
        </div>
        <CodeBlock
          language="bash"
          code={`pnpm add @i-design/react     # 或 @i-design/vue
# 样式与令牌一并引入
# import '@i-design/core/styles';`}
        />
      </section>
    </div>
  );
}
