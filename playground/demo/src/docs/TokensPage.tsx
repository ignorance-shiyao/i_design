import { palettes, densityTokens, shapeTokens } from '@i-design/tokens';
import { Table } from '@i-design/react';

const SCALE_LABEL: Record<string, string> = {
  brand: '品牌 Brand',
  green: '成功 Green',
  amber: '警告 Amber',
  red: '危险 Red',
  grey: '中性 Grey',
};

const SEMANTIC_GROUPS: Array<{ title: string; tokens: string[] }> = [
  { title: '文字', tokens: ['color-text-primary', 'color-text-secondary', 'color-text-tertiary', 'color-text-placeholder', 'color-text-disabled'] },
  { title: '表面', tokens: ['color-bg-page', 'color-bg-container', 'color-bg-elevated', 'color-bg-subtle', 'color-bg-muted', 'color-bg-hover', 'color-bg-active'] },
  { title: '描边', tokens: ['color-border-subtle', 'color-border', 'color-border-strong', 'color-ring'] },
  { title: '品牌与状态', tokens: ['color-brand', 'color-brand-subtle', 'color-success', 'color-success-subtle', 'color-warning', 'color-warning-subtle', 'color-danger', 'color-danger-subtle'] },
];

const RADII = ['radius-xs', 'radius-s', 'radius-m', 'radius-l', 'radius-round'];
const SHADOWS = ['shadow-1', 'shadow-2', 'shadow-3', 'shadow-4'];
const SPACES = ['space-0', 'space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6'];
const TYPE = ['font-size-s', 'font-size-m', 'font-size-l', 'font-size-xl', 'font-size-2xl', 'font-size-3xl'];

export function TokensPage() {
  return (
    <>
      <div className="page__head">
        <h1 className="page__title">设计令牌</h1>
        <p className="page__lede">
          令牌分两层：<b>基元</b>是 RGB 三元组（<code>--i-brand-5: 65, 105, 239</code>），
          <b>语义令牌</b>用 <code>rgba(var(--i-brand-5), .08)</code> 组合出状态。
          好处是同一个色相自动派生出文字层级、描边与填充，换肤时只需替换三元组，
          而不是重新挑几十个十六进制值。
        </p>
      </div>

      <section className="section" id="palette">
        <h2 className="section__title">色板</h2>
        <p className="section__desc">每个色相 10 阶，感知间距均匀。浅色模式取第 5 阶为基色，深色模式取第 4 阶。</p>
        {Object.entries(palettes).map(([name, scale]) => (
          <div className="ramp" key={name}>
            <div className="ramp__label">{SCALE_LABEL[name] ?? name}</div>
            <div className="ramp__row">
              {scale.map((triplet, step) => (
                <div className="ramp__step" key={step}>
                  <div className="ramp__chip" style={{ background: `rgb(${triplet})` }} />
                  <span className="ramp__index">{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="section" id="semantic">
        <h2 className="section__title">语义令牌</h2>
        <p className="section__desc">组件只消费这一层。下面的色块是实时计算值，会跟随当前主题与品牌色变化。</p>
        {SEMANTIC_GROUPS.map((group) => (
          <div className="tokens" key={group.title}>
            <div className="tokens__title">{group.title}</div>
            <div className="tokens__grid">
              {group.tokens.map((token) => (
                <div className="tokens__item" key={token}>
                  <span className="tokens__swatch" style={{ background: `var(--i-${token})` }} />
                  <code>--i-{token}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="section" id="shape">
        <h2 className="section__title">圆角、阴影与间距</h2>
        <p className="section__desc">圆角克制在 3 / 6 / 12：过大的圆角会让密集界面显得臃肿。阴影是一道发丝线加一层环境投影；深色模式改用内阴影描边。</p>

        <div className="specimen">
          {RADII.map((token) => (
            <div className="specimen__item" key={token}>
              <div className="specimen__box" style={{ borderRadius: `var(--i-${token})` }} />
              <code>{token}</code>
              <span className="specimen__value">{shapeTokens[token]}</span>
            </div>
          ))}
        </div>

        <div className="specimen">
          {SHADOWS.map((token) => (
            <div className="specimen__item" key={token}>
              <div className="specimen__box specimen__box--plain" style={{ boxShadow: `var(--i-${token})` }} />
              <code>{token}</code>
            </div>
          ))}
        </div>

        <div className="specimen specimen--stack">
          {SPACES.map((token) => (
            <div className="specimen__bar" key={token}>
              <span className="specimen__bar-fill" style={{ inlineSize: `var(--i-${token})` }} />
              <code>{token}</code>
              <span className="specimen__value">{shapeTokens[token]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="type">
        <h2 className="section__title">字号</h2>
        <p className="section__desc">正文 14px、辅助 12px，标题 16 → 32。中文在 13px 以下笔画会糊，所以基准取 14。</p>
        <div className="type-scale">
          {TYPE.map((token) => (
            <div className="type-scale__row" key={token}>
              <span style={{ fontSize: `var(--i-${token})` }}>设计令牌 Design Tokens</span>
              <code>{token}</code>
              <span className="specimen__value">{shapeTokens[token]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="density">
        <h2 className="section__title">密度</h2>
        <p className="section__desc">
          密度是一等公民：切换后所有控件的高度与内边距一起变化，而不是逐个组件传 size。
          顶部工具栏可以实时切换。
        </p>
        <Table
          size="s"
          rowKey={(row) => String(row.token)}
          columns={[
            { key: 'token', title: '令牌', width: 200 },
            { key: 'compact', title: 'compact', width: 120 },
            { key: 'default', title: 'default', width: 120 },
            { key: 'loose', title: 'loose', width: 120 },
          ]}
          data={Object.keys(densityTokens.default).map((token) => ({
            token,
            compact: densityTokens.compact[token]!,
            default: densityTokens.default[token]!,
            loose: densityTokens.loose[token]!,
          }))}
          renderCell={(column, row) => (column.key === 'token' ? <code>{String(row.token)}</code> : undefined)}
        />
      </section>
    </>
  );
}

export const TOKEN_ANCHORS = [
  { id: 'palette', label: '色板' },
  { id: 'semantic', label: '语义令牌' },
  { id: 'shape', label: '圆角、阴影与间距' },
  { id: 'type', label: '字号' },
  { id: 'density', label: '密度' },
];
