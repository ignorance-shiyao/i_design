import { agentEntries } from './registry-agent.js';
import { useEffect, useMemo, useState } from 'react';
import {
  Button, CodeBlock, ConfigProvider, Empty, Icon, Input, Table, Tabs, Tag,
  applyTheme,
} from '@i-design/react';
import { basicEntries } from './registry-basic.js';
import { formEntries } from './registry-form.js';
import { navEntries } from './registry-nav.js';
import { aiEntries } from './registry-ai.js';
import { moreEntries } from './registry-more.js';
import { advancedEntries } from './registry-advanced.js';
import { TokensPage, TOKEN_ANCHORS } from './TokensPage.js';
import { Landing } from './Landing.js';
import { Dashboard } from './Dashboard.js';
import { SettingsPanel, DEFAULT_SETTINGS, BRANDS, type SiteSettings } from './SettingsPanel.js';
import type { DocEntry, Demo } from './types.js';

const ENTRIES: DocEntry[] = [...basicEntries, ...formEntries, ...navEntries, ...moreEntries, ...advancedEntries, ...aiEntries, ...agentEntries];
const CATEGORIES = ['通用', '数据录入', '导航', '数据展示', '反馈', 'AI 会话'];

type Page = 'overview' | 'console' | 'tokens' | string;

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

const RADIUS_TOKENS: Array<[string, number]> = [
  ['--i-radius-xs', 2], ['--i-radius-s', 3], ['--i-radius-m', 6], ['--i-radius-l', 12], ['--i-radius-xl', 12],
];
const FONT_TOKENS: Array<[string, number]> = [
  ['--i-font-size-xs', 12], ['--i-font-size-s', 12], ['--i-font-size-m', 14],
  ['--i-font-size-l', 16], ['--i-font-size-xl', 20], ['--i-font-size-2xl', 24], ['--i-font-size-3xl', 32],
];

export function App() {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const stamped = document.documentElement.getAttribute('data-theme');
    return {
      ...DEFAULT_SETTINGS,
      mode: stamped === 'dark' ? 'dark' : stamped === 'light' ? 'light' : 'auto',
    };
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState<Page>('overview');
  const [filter, setFilter] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  const patch = (next: Partial<SiteSettings>): void => setSettings((prev) => ({ ...prev, ...next }));

  useEffect(() => {
    applyTheme({
      mode: settings.mode,
      density: settings.density,
      dir: settings.dir,
      motion: settings.motion ? 'auto' : 'off',
    });
  }, [settings.mode, settings.density, settings.dir, settings.motion]);

  // Every knob below writes CSS variables — no rebuild, no second stylesheet.
  useEffect(() => {
    const root = document.documentElement.style;
    const brand = BRANDS.find((item) => item.triplet === settings.brand) ?? BRANDS[0]!;
    root.setProperty('--i-brand-5', brand.triplet);
    root.setProperty('--i-brand-4', brand.hover);
    root.setProperty('--i-brand-6', brand.active);
    for (const [token, base] of RADIUS_TOKENS) {
      root.setProperty(token, `${Math.round(base * settings.radius)}px`);
    }
    for (const [token, base] of FONT_TOKENS) {
      root.setProperty(token, `${Math.round(base * settings.fontScale * 100) / 100}px`);
    }
  }, [settings.brand, settings.radius, settings.fontScale]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setNavOpen(false);
  }, [page]);

  const { mode, density, locale } = settings;

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

  const anchors = page === 'overview' || page === 'console'
    ? []
    : page === 'tokens'
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
        <button className="topbar__menu" aria-label="打开导航" onClick={() => setNavOpen((value) => !value)}>
          <Icon name="menu" size={18} />
        </button>

        <button className="topbar__brand" onClick={() => setPage('overview')}>
          <span className="topbar__mark">i</span>
          <span className="topbar__wordmark">i-design</span>
          <span className="topbar__version">0.7.0</span>
        </button>

        <nav className="topbar__nav">
          {([
            ['overview', '首页'],
            ['console', '示例'],
            ['tokens', '设计'],
            ['button', '组件'],
          ] as const).map(([target, label]) => {
            const active = target === 'button' ? Boolean(entry) : page === target;
            return (
              <button
                key={target}
                className={`topbar__link${active ? ' topbar__link--active' : ''}`}
                onClick={() => setPage(target)}
              >
                {label}
              </button>
            );
          })}
        </nav>

        <div className="topbar__controls">
          <button
            className="topbar__icon"
            aria-label={mode === 'dark' ? '切换到浅色' : '切换到深色'}
            onClick={() => patch({ mode: mode === 'dark' ? 'light' : 'dark' })}
          >
            <Icon name={mode === 'dark' ? 'star' : 'eye'} size={16} />
          </button>
          <button className="topbar__icon" aria-label="外观设置" onClick={() => setSettingsOpen(true)}>
            <Icon name="filter" size={16} />
          </button>
        </div>
      </header>

      <div className={`shell${page === "console" ? " shell--full" : page === "overview" ? " shell--bleed" : ""}`}>
        <aside className={`sidebar${navOpen ? " sidebar--open" : ""}`}>
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

        <main className={`content${page === 'console' ? ' content--full' : ''}`}>
          <article className={`content__body${page === 'console' ? ' content__body--full' : ''}`}>
            {page === 'overview' ? (
              <Landing onNavigate={setPage} />
            ) : page === 'console' ? (
              <Dashboard />
            ) : page === 'tokens' ? (
              <TokensPage />
            ) : entry ? (
              <ComponentPage entry={entry} />
            ) : null}

            {page !== 'console' && <footer className="footer">
              <span>i-design · 令牌与行为在 core，React / Vue 只做翻译</span>
              <span>本文档站由 i-design 自己搭建</span>
            </footer>}
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

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={patch}
        onReset={() => setSettings({ ...DEFAULT_SETTINGS, mode: settings.mode })}
      />
    </ConfigProvider>
  );
}
