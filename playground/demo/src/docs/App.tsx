import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, CodeBlock, ConfigProvider, Space, Table, Tabs, Tag,
  applyTheme, type Density, type LocaleName, type ThemeMode,
} from '@i-design/react';
import { basicEntries } from './registry-basic.js';
import { formEntries } from './registry-form.js';
import { navEntries } from './registry-nav.js';
import { aiEntries } from './registry-ai.js';
import type { DocEntry } from './types.js';

const ENTRIES: DocEntry[] = [...basicEntries, ...formEntries, ...navEntries, ...aiEntries];
const CATEGORIES = ['通用', '数据录入', '导航', 'AI 会话'];

const BRANDS = [
  { name: '钴蓝', base: '#4169ef', hover: '#6b90fb', active: '#2f4fd0' },
  { name: '墨绿', base: '#12b76a', hover: '#32d583', active: '#039855' },
  { name: '紫罗兰', base: '#7c5cf5', hover: '#9b83f8', active: '#6541e0' },
  { name: '赤陶', base: '#dc6803', hover: '#f79009', active: '#b54708' },
];

/** Usage block: the ONE place where the two frameworks are shown side by side. */
function Usage({ react, vue }: { react: string; vue: string }) {
  return (
    <Tabs
      variant="segment"
      size="s"
      defaultValue="react"
      items={[{ value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }]}
    >
      {(item) => <CodeBlock language={item.value === 'react' ? 'tsx' : 'vue'} code={item.value === 'react' ? react : vue} />}
    </Tabs>
  );
}

function Section({ entry }: { entry: DocEntry }) {
  return (
    <section className="section" id={entry.id}>
      <div className="section__head">
        <h2 className="section__title">{entry.cn}</h2>
        <span className="section__en">{entry.name}</span>
      </div>
      <p className="section__desc">{entry.description}</p>

      {entry.demos.map((demo) => (
        <div className="demo" key={demo.caption}>
          <div className="demo__caption">{demo.caption}</div>
          <div className="demo__stage">{demo.render()}</div>
          <div className="demo__usage">
            <Usage react={demo.react} vue={demo.vue} />
          </div>
        </div>
      ))}

      {entry.props && (
        <div className="api">
          <div className="api__title">API</div>
          <Table
            size="s"
            rowKey={(row) => String(row.name)}
            columns={[
              { key: 'name', title: '属性', width: 190 },
              { key: 'type', title: '类型' },
              { key: 'default', title: '默认值', width: 110 },
              { key: 'desc', title: '说明' },
            ]}
            data={entry.props as unknown as Record<string, unknown>[]}
            renderCell={(column, row) =>
              column.key === 'name' ? <code>{String(row.name)}</code>
              : column.key === 'type' ? <code>{String(row.type)}</code>
              : column.key === 'default' ? (row.default ? <code>{String(row.default)}</code> : '—')
              : undefined
            }
          />
        </div>
      )}
    </section>
  );
}

export function App() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stamped = document.documentElement.getAttribute('data-theme');
    return stamped === 'dark' ? 'dark' : stamped === 'light' ? 'light' : 'auto';
  });
  const [density, setDensity] = useState<Density>('default');
  const [locale, setLocale] = useState<LocaleName>('zh-CN');
  const [brand, setBrand] = useState(BRANDS[0]!);
  const [active, setActive] = useState(ENTRIES[0]!.id);

  // Theme lives on <html> so portalled dialogs, drawers and toasts inherit it.
  useEffect(() => { applyTheme({ mode, density }); }, [mode, density]);
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--i-color-brand', brand.base);
    root.setProperty('--i-color-brand-hover', brand.hover);
    root.setProperty('--i-color-brand-active', brand.active);
    root.setProperty('--i-color-ring', `${brand.base}55`);
  }, [brand]);

  // Scrollspy for the sidebar.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records.filter((record) => record.isIntersecting);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-72px 0px -70% 0px' },
    );
    for (const entry of ENTRIES) {
      const node = document.getElementById(entry.id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  const grouped = useMemo(
    () => CATEGORIES.map((category) => ({ category, items: ENTRIES.filter((entry) => entry.category === category) })),
    [],
  );

  return (
    <ConfigProvider mode={mode} density={density} locale={locale}>
      <div className="site">
        <aside className="site__sidebar">
          <div className="site__brand">
            <span className="site__mark">i</span>
            <span>
              <div className="site__wordmark">i-design</div>
              <div className="site__version">v0.4.0 · React + Vue</div>
            </span>
          </div>

          <nav className="site__nav">
            {grouped.map((group) => (
              <div className="site__nav-group" key={group.category}>
                <div className="site__nav-title">{group.category}</div>
                {group.items.map((entry) => (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    className={`site__nav-link${active === entry.id ? ' site__nav-link--active' : ''}`}
                  >
                    <span>{entry.cn}</span>
                    <span className="site__nav-en">{entry.name.split(' / ')[0]}</span>
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="site__main">
          <header className="site__header">
            <strong style={{ fontSize: 'var(--i-font-size-m)' }}>组件文档</strong>
            <div className="site__controls">
              <div className="site__control">
                <span className="site__control-label">主题</span>
                <Tabs
                  size="s"
                  variant="segment"
                  value={mode}
                  onChange={(value) => setMode(value as ThemeMode)}
                  items={[{ value: 'light', label: '浅' }, { value: 'dark', label: '深' }, { value: 'auto', label: '跟随' }]}
                >
                  {() => null}
                </Tabs>
              </div>
              <div className="site__control">
                <span className="site__control-label">密度</span>
                <Tabs
                  size="s"
                  variant="segment"
                  value={density}
                  onChange={(value) => setDensity(value as Density)}
                  items={[{ value: 'compact', label: '紧凑' }, { value: 'default', label: '默认' }, { value: 'loose', label: '宽松' }]}
                >
                  {() => null}
                </Tabs>
              </div>
              <div className="site__control">
                <span className="site__control-label">语言</span>
                <Tabs
                  size="s"
                  variant="segment"
                  value={locale}
                  onChange={(value) => setLocale(value as LocaleName)}
                  items={[{ value: 'zh-CN', label: '中' }, { value: 'en-US', label: 'EN' }, { value: 'ar-EG', label: 'AR' }]}
                >
                  {() => null}
                </Tabs>
              </div>
              <div className="site__control">
                <span className="site__control-label">品牌色</span>
                <span className="site__swatches">
                  {BRANDS.map((item) => (
                    <button
                      key={item.name}
                      title={item.name}
                      aria-label={item.name}
                      className={`site__swatch${brand.name === item.name ? ' site__swatch--active' : ''}`}
                      style={{ background: item.base }}
                      onClick={() => setBrand(item)}
                    />
                  ))}
                </span>
              </div>
            </div>
          </header>

          <div className="site__content">
            <section className="hero">
              <div className="hero__eyebrow">跨框架组件库</div>
              <h1 className="hero__title">一套设计令牌与行为逻辑，同时驱动 React 与 Vue</h1>
              <p className="hero__lede">
                设计令牌、样式、交互行为、无障碍语义只写一份，放在 <code>@i-design/core</code>；
                React 与 Vue 各自只有一层约 15 行的属性翻译。同样的 props 必然产出同样的 DOM——
                这条约束由跨框架一致性测试强制保证。
              </p>
              <div className="hero__stats">
                {[
                  { value: '32', label: '组件（双端一致）' },
                  { value: '96', label: '测试全绿' },
                  { value: '0', label: '运行时依赖' },
                  { value: '3', label: '密度档位 · 3 主题模式' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="hero__stat-value">{stat.value}</div>
                    <div className="hero__stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBlockStart: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Alert status="info" title="关于本页的演示">
                  每个组件只演示一次。React 与 Vue 的差异放在下方「用法」的代码切换里——
                  因为两端产出的 DOM 本就相同，演示两遍没有意义。
                </Alert>
                <Space wrap>
                  <Tag status="brand">design tokens</Tag>
                  <Tag status="success">headless core</Tag>
                  <Tag status="warning">WAI-ARIA</Tag>
                  <Tag>RTL</Tag>
                  <Tag>SSR-safe</Tag>
                  <Button size="s" variant="text" onClick={() => document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })}>
                    直接看 AI 会话组件 →
                  </Button>
                </Space>
              </div>
            </section>

            {ENTRIES.map((entry) => (
              <Section key={entry.id} entry={entry} />
            ))}

            <footer style={{ paddingBlock: 32, color: 'var(--i-color-text-tertiary)', fontSize: 'var(--i-font-size-s)' }}>
              i-design · 令牌与行为在 core，React / Vue 只做翻译 · 本页由 i-design 自己搭建
            </footer>
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}
