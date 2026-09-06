import { useEffect, useMemo, useState } from 'react';
import {
  Button, CodeBlock, ConfigProvider, Empty, Input, Table, Tabs, Tag,
  applyTheme, type Density, type LocaleName, type ThemeMode,
} from '@i-design/react';
import { basicEntries } from './registry-basic.js';
import { formEntries } from './registry-form.js';
import { navEntries } from './registry-nav.js';
import { aiEntries } from './registry-ai.js';
import { TokensPage, TOKEN_ANCHORS } from './TokensPage.js';
import type { DocEntry, Demo } from './types.js';

const ENTRIES: DocEntry[] = [...basicEntries, ...formEntries, ...navEntries, ...aiEntries];
const CATEGORIES = ['通用', '数据录入', '导航', 'AI 会话'];

const BRANDS = [
  { name: '钴蓝', triplet: '65, 105, 239', hover: '107, 144, 251', active: '47, 79, 208' },
  { name: '墨绿', triplet: '18, 183, 106', hover: '50, 213, 131', active: '3, 152, 85' },
  { name: '紫罗兰', triplet: '124, 92, 245', hover: '155, 131, 248', active: '101, 65, 224' },
  { name: '赤陶', triplet: '220, 104, 3', hover: '247, 144, 9', active: '181, 71, 8' },
];

type Page = 'overview' | 'tokens' | string;

/** A demo card: stage on top, collapsible source underneath. */
function DemoCard({ demo, index }: { demo: Demo; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="demo" id={`demo-${index}`}>
      <div className="demo__head">
        <span className="demo__title">{demo.caption}</span>
        {demo.hint && <span className="demo__hint">{demo.hint}</span>}
      </div>
      <div className="demo__stage">{demo.render()}</div>
      <div className="demo__bar">
        <button className="demo__toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {/* A rotated chevron rather than ▾/▸: those glyphs collapse into a dash at small sizes. */}
          <span className={`demo__chevron${open ? ' demo__chevron--open' : ''}`} aria-hidden="true">›</span>
          {open ? '收起代码' : '展开代码'}
        </button>
      </div>
      {open && (
        <div className="demo__code">
          <Tabs
            variant="segment"
            size="s"
            defaultValue="react"
            items={[{ value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }]}
          >
            {(item) => (
              <CodeBlock
                language={item.value === 'react' ? 'tsx' : 'vue'}
                code={item.value === 'react' ? demo.react : demo.vue}
              />
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}

function ComponentPage({ entry }: { entry: DocEntry }) {
  return (
    <>
      <div className="page__head">
        <h1 className="page__title">
          {entry.cn} <span className="page__en">{entry.name}</span>
        </h1>
        <p className="page__lede">{entry.description}</p>
      </div>

      {entry.whenToUse && (
        <section className="section" id="when">
          <h2 className="section__title">何时使用</h2>
          <ul className="bullets">
            {entry.whenToUse.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="section" id="demos">
        <h2 className="section__title">代码演示</h2>
        <p className="section__desc">
          每个组件只演示一次。React 与 Vue 的差异在「展开代码」里切换——两端渲染出的 DOM 本就相同。
        </p>
        {entry.demos.map((demo, index) => (
          <DemoCard demo={demo} index={index} key={demo.caption} />
        ))}
      </section>

      {entry.props && (
        <section className="section" id="api">
          <h2 className="section__title">API</h2>
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
              : column.key === 'type' ? <code className="api__type">{String(row.type)}</code>
              : column.key === 'default' ? (row.default ? <code>{String(row.default)}</code> : '—')
              : undefined
            }
          />
        </section>
      )}
    </>
  );
}

function Overview({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <div className="page__head">
        <div className="page__eyebrow">跨框架组件库</div>
        <h1 className="page__title page__title--hero">一套设计令牌与行为逻辑，同时驱动 React 与 Vue</h1>
        <p className="page__lede">
          设计令牌、样式、交互行为、无障碍语义只写一份，放在 <code>@i-design/core</code>；
          React 与 Vue 各自只有一层约 15 行的属性翻译。同样的 props 必然产出同样的 DOM——
          这条约束由跨框架一致性测试强制保证。
        </p>
        <div className="stats">
          {[
            { value: '32', label: '组件（双端一致）' },
            { value: '106', label: '测试全绿' },
            { value: '0', label: '运行时依赖' },
            { value: '2', label: '层令牌：基元 + 语义' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="stats__value">{stat.value}</div>
              <div className="stats__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="section">
        <h2 className="section__title">架构</h2>
        <div className="arch">
          <div className="arch__row">
            <code className="arch__name">@i-design/tokens</code>
            <span className="arch__desc">RGB 三元组基元 + 语义令牌，编译为 CSS 变量</span>
          </div>
          <div className="arch__link" aria-hidden="true" />
          <div className="arch__row">
            <code className="arch__name">@i-design/core</code>
            <span className="arch__desc">无头行为、类名、无障碍语义、定位、动效状态机、语法高亮、样式表</span>
          </div>
          <div className="arch__link arch__link--split" aria-hidden="true" />
          <div className="arch__pair">
            <div className="arch__row">
              <code className="arch__name">@i-design/react</code>
              <span className="arch__desc">约 15 行 toProps()：class → className，click → onClick</span>
            </div>
            <div className="arch__row">
              <code className="arch__name">@i-design/vue</code>
              <span className="arch__desc">约 15 行 toProps()：同一份 ElementSpec，换一种写法</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">安装</h2>
        <CodeBlock language="bash" code={`pnpm add @i-design/react   # 或 @i-design/vue\n# 样式与令牌一并引入\n# import '@i-design/core/styles';`} />
      </section>

      <section className="section">
        <h2 className="section__title">从这里开始</h2>
        <div className="cards">
          <button className="cards__item" onClick={() => onNavigate('tokens')}>
            <div className="cards__title">设计令牌</div>
            <div className="cards__desc">两层令牌结构、色板、圆角、阴影、密度</div>
          </button>
          <button className="cards__item" onClick={() => onNavigate('button')}>
            <div className="cards__title">组件</div>
            <div className="cards__desc">32 个组件的演示、双端用法与 API</div>
          </button>
          <button className="cards__item" onClick={() => onNavigate('chat')}>
            <div className="cards__title">AI 会话</div>
            <div className="cards__desc">流式、输入法安全发送、滚动跟随</div>
          </button>
        </div>
      </section>
    </>
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
  const [page, setPage] = useState<Page>('overview');
  const [filter, setFilter] = useState('');

  useEffect(() => { applyTheme({ mode, density }); }, [mode, density]);

  // Rebranding is three triplets — the whole point of the primitive layer.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--i-brand-5', brand.triplet);
    root.setProperty('--i-brand-4', brand.hover);
    root.setProperty('--i-brand-6', brand.active);
  }, [brand]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);

  const entry = ENTRIES.find((item) => item.id === page);
  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return CATEGORIES.map((category) => ({
      category,
      items: ENTRIES.filter(
        (item) =>
          item.category === category &&
          (needle === '' || item.cn.includes(needle) || item.name.toLowerCase().includes(needle)),
      ),
    })).filter((group) => group.items.length > 0);
  }, [filter]);

  const anchors = page === 'tokens'
    ? TOKEN_ANCHORS
    : entry
      ? [
          ...(entry.whenToUse ? [{ id: 'when', label: '何时使用' }] : []),
          { id: 'demos', label: '代码演示' },
          ...(entry.props ? [{ id: 'api', label: 'API' }] : []),
        ]
      : [];

  return (
    <ConfigProvider mode={mode} density={density} locale={locale}>
      <header className="topbar">
        <button className="topbar__brand" onClick={() => setPage('overview')}>
          <span className="topbar__mark">i</span>
          <span className="topbar__wordmark">i-design</span>
          <span className="topbar__version">0.5.0</span>
        </button>

        <nav className="topbar__nav">
          <button className={`topbar__link${page === 'overview' ? ' topbar__link--active' : ''}`} onClick={() => setPage('overview')}>
            概览
          </button>
          <button className={`topbar__link${page === 'tokens' ? ' topbar__link--active' : ''}`} onClick={() => setPage('tokens')}>
            设计
          </button>
          <button className={`topbar__link${entry ? ' topbar__link--active' : ''}`} onClick={() => setPage('button')}>
            组件
          </button>
        </nav>

        <div className="topbar__controls">
          <Tabs size="s" variant="segment" value={mode} onChange={(value) => setMode(value as ThemeMode)}
                items={[{ value: 'light', label: '浅' }, { value: 'dark', label: '深' }, { value: 'auto', label: '跟随' }]}>
            {() => null}
          </Tabs>
          <Tabs size="s" variant="segment" value={density} onChange={(value) => setDensity(value as Density)}
                items={[{ value: 'compact', label: '紧凑' }, { value: 'default', label: '默认' }, { value: 'loose', label: '宽松' }]}>
            {() => null}
          </Tabs>
          <Tabs size="s" variant="segment" value={locale} onChange={(value) => setLocale(value as LocaleName)}
                items={[{ value: 'zh-CN', label: '中' }, { value: 'en-US', label: 'EN' }, { value: 'ar-EG', label: 'AR' }]}>
            {() => null}
          </Tabs>
          <span className="topbar__swatches">
            {BRANDS.map((item) => (
              <button
                key={item.name}
                title={item.name}
                aria-label={item.name}
                aria-pressed={brand.name === item.name}
                className={`topbar__swatch${brand.name === item.name ? ' topbar__swatch--active' : ''}`}
                style={{ background: `rgb(${item.triplet})` }}
                onClick={() => setBrand(item)}
              />
            ))}
          </span>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <div className="sidebar__search">
            <Input size="s" value={filter} onChange={setFilter} clearable placeholder="搜索组件" prefix={<span aria-hidden="true">⌕</span>} />
          </div>
          <button
            className={`sidebar__link${page === 'tokens' ? ' sidebar__link--active' : ''}`}
            onClick={() => setPage('tokens')}
          >
            <span>设计令牌</span>
            <span className="sidebar__en">Tokens</span>
          </button>
          {groups.map((group) => (
            <div className="sidebar__group" key={group.category}>
              <div className="sidebar__title">{group.category}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`sidebar__link${page === item.id ? ' sidebar__link--active' : ''}`}
                  onClick={() => setPage(item.id)}
                >
                  <span>{item.cn}</span>
                  <span className="sidebar__en">{item.name.split(' / ')[0]}</span>
                </button>
              ))}
            </div>
          ))}
          {groups.length === 0 && <Empty description="没有匹配的组件" />}
        </aside>

        <main className="content">
          <article className="content__body">
            {page === 'overview' ? <Overview onNavigate={setPage} /> : page === 'tokens' ? <TokensPage /> : entry ? <ComponentPage entry={entry} /> : null}

            <footer className="footer">
              <span>i-design · 令牌与行为在 core，React / Vue 只做翻译</span>
              <span>本文档站由 i-design 自己搭建</span>
            </footer>
          </article>

          {anchors.length > 0 && (
            <nav className="toc" aria-label="本页目录">
              <div className="toc__title">本页目录</div>
              {anchors.map((anchor) => (
                <a className="toc__link" href={`#${anchor.id}`} key={anchor.id}>
                  {anchor.label}
                </a>
              ))}
              {entry && (
                <div className="toc__meta">
                  <Tag size="s">{entry.category}</Tag>
                  <Button size="s" variant="text" onClick={() => setPage('tokens')}>查看令牌 →</Button>
                </div>
              )}
            </nav>
          )}
        </main>
      </div>
    </ConfigProvider>
  );
}
