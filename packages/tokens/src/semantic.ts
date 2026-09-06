import { palettes, darkSurfaces, constants } from './palette.js';

/**
 * Semantic tokens are the only layer components may consume.
 * Keys become CSS custom properties with the `--i-` prefix, so
 * `color-bg-container` is `--i-color-bg-container`.
 */
export type SemanticTokens = Record<string, string>;

const g = palettes.gray;
const b = palettes.brand;
const r = palettes.red;
const a = palettes.amber;
const s = palettes.green;

export const lightTokens: SemanticTokens = {
  /* Brand ------------------------------------------------------------- */
  'color-brand': b[5],
  'color-brand-hover': b[4],
  'color-brand-active': b[6],
  'color-brand-subtle': b[0],
  'color-brand-subtle-hover': b[1],
  'color-brand-border': b[2],
  'color-brand-text': b[6],
  'color-on-brand': constants.white,

  /* Status ------------------------------------------------------------ */
  'color-success': s[5],
  'color-success-text': s[6],
  'color-success-subtle': s[0],
  'color-success-border': s[2],
  'color-warning': a[5],
  'color-warning-text': a[6],
  'color-warning-subtle': a[0],
  'color-warning-border': a[2],
  'color-danger': r[5],
  'color-danger-hover': r[4],
  'color-danger-active': r[6],
  'color-danger-text': r[6],
  'color-danger-subtle': r[0],
  'color-danger-border': r[2],
  'color-on-status': constants.white,

  /* Surfaces ---------------------------------------------------------- */
  'color-bg-page': g[0],
  'color-bg-container': constants.white,
  'color-bg-elevated': constants.white,
  'color-bg-raised': constants.white,
  'color-bg-subtle': g[0],
  'color-bg-muted': g[1],
  'color-bg-hover': 'rgba(23, 27, 35, 0.045)',
  'color-bg-active': 'rgba(23, 27, 35, 0.08)',
  'color-bg-disabled': g[1],
  'color-bg-inverse': g[9],
  'color-bg-mask': 'rgba(16, 20, 28, 0.48)',

  /* Text -------------------------------------------------------------- */
  'color-text-primary': g[9],
  'color-text-secondary': g[6],
  'color-text-tertiary': g[5],
  'color-text-placeholder': g[4],
  'color-text-disabled': g[4],
  'color-text-inverse': constants.white,
  'color-text-link': b[5],

  /* Lines ------------------------------------------------------------- */
  'color-border': g[2],
  'color-border-strong': g[3],
  'color-border-subtle': g[1],
  'color-ring': 'rgba(65, 105, 239, 0.32)',

  /*
   * Elevation. Two layers per level — a tight contact shadow plus a wide
   * ambient one — tinted with the neutral hue instead of pure black, which is
   * what stops shadows reading as grey smudges.
   */
  'shadow-1': '0 1px 2px rgba(16, 20, 28, 0.06), 0 1px 1px rgba(16, 20, 28, 0.04)',
  'shadow-2': '0 2px 4px rgba(16, 20, 28, 0.05), 0 4px 12px rgba(16, 20, 28, 0.07)',
  'shadow-3': '0 4px 8px rgba(16, 20, 28, 0.06), 0 12px 28px rgba(16, 20, 28, 0.10)',
  'shadow-4': '0 8px 16px rgba(16, 20, 28, 0.08), 0 24px 56px rgba(16, 20, 28, 0.16)',
  /** Inner top highlight that gives solid surfaces a lit edge. */
  'shadow-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.14)',
};

export const darkTokens: SemanticTokens = {
  'color-brand': b[4],
  'color-brand-hover': b[3],
  'color-brand-active': b[5],
  'color-brand-subtle': 'rgba(107, 144, 251, 0.14)',
  'color-brand-subtle-hover': 'rgba(107, 144, 251, 0.22)',
  'color-brand-border': 'rgba(107, 144, 251, 0.38)',
  'color-brand-text': b[3],
  'color-on-brand': '#0b0f18',

  'color-success': s[4],
  'color-success-text': s[3],
  'color-success-subtle': 'rgba(50, 213, 131, 0.14)',
  'color-success-border': 'rgba(50, 213, 131, 0.34)',
  'color-warning': a[4],
  'color-warning-text': a[3],
  'color-warning-subtle': 'rgba(253, 176, 34, 0.14)',
  'color-warning-border': 'rgba(253, 176, 34, 0.34)',
  'color-danger': r[4],
  'color-danger-hover': r[3],
  'color-danger-active': r[5],
  'color-danger-text': r[3],
  'color-danger-subtle': 'rgba(249, 112, 102, 0.14)',
  'color-danger-border': 'rgba(249, 112, 102, 0.34)',
  'color-on-status': '#0b0f18',

  'color-bg-page': darkSurfaces.page,
  'color-bg-container': darkSurfaces.container,
  'color-bg-elevated': darkSurfaces.elevated,
  'color-bg-raised': darkSurfaces.raised,
  'color-bg-subtle': '#181d25',
  'color-bg-muted': darkSurfaces.elevated,
  'color-bg-hover': 'rgba(255, 255, 255, 0.055)',
  'color-bg-active': 'rgba(255, 255, 255, 0.1)',
  'color-bg-disabled': 'rgba(255, 255, 255, 0.04)',
  'color-bg-inverse': g[0],
  'color-bg-mask': 'rgba(6, 8, 12, 0.66)',

  'color-text-primary': '#e8ebf2',
  'color-text-secondary': '#9aa4b6',
  'color-text-tertiary': '#7b8598',
  'color-text-placeholder': '#666f80',
  'color-text-disabled': '#525b6b',
  'color-text-inverse': g[9],
  'color-text-link': b[3],

  'color-border': 'rgba(255, 255, 255, 0.11)',
  'color-border-strong': 'rgba(255, 255, 255, 0.2)',
  'color-border-subtle': 'rgba(255, 255, 255, 0.06)',
  'color-ring': 'rgba(107, 144, 251, 0.42)',

  // Dark surfaces get depth from a lit top edge more than from shadow, so the
  // ambient layers stay deep and the highlight does the separating.
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.4)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.34)',
  'shadow-3': '0 4px 8px rgba(0, 0, 0, 0.44), 0 12px 28px rgba(0, 0, 0, 0.4)',
  'shadow-4': '0 8px 16px rgba(0, 0, 0, 0.5), 0 24px 56px rgba(0, 0, 0, 0.5)',
  'shadow-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.07)',
};
