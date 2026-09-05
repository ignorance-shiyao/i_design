import { palettes, constants } from './palette.js';

/**
 * Semantic tokens are the only layer components are allowed to consume.
 * Keys are emitted as CSS custom properties with the `--i-` prefix, so
 * `color-bg-container` becomes `--i-color-bg-container`.
 */
export type SemanticTokens = Record<string, string>;

const g = palettes.gray;
const b = palettes.blue;
const r = palettes.red;
const o = palettes.orange;
const s = palettes.green;

export const lightTokens: SemanticTokens = {
  /* Brand ------------------------------------------------------------- */
  'color-brand': b[5],
  'color-brand-hover': b[4],
  'color-brand-active': b[6],
  'color-brand-subtle': b[0],
  'color-brand-border': b[2],
  'color-on-brand': constants.white,

  /* Status ------------------------------------------------------------ */
  'color-success': s[5],
  'color-success-subtle': s[0],
  'color-warning': o[5],
  'color-warning-subtle': o[0],
  'color-danger': r[5],
  'color-danger-hover': r[4],
  'color-danger-active': r[6],
  'color-danger-subtle': r[0],
  'color-on-status': constants.white,

  /* Surfaces ---------------------------------------------------------- */
  'color-bg-page': g[0],
  'color-bg-container': constants.white,
  'color-bg-elevated': constants.white,
  'color-bg-subtle': g[1],
  'color-bg-hover': g[1],
  'color-bg-active': g[2],
  'color-bg-disabled': g[1],
  'color-bg-mask': 'rgba(24, 28, 38, 0.6)',

  /* Text -------------------------------------------------------------- */
  'color-text-primary': g[9],
  'color-text-secondary': g[6],
  'color-text-placeholder': g[4],
  'color-text-disabled': g[4],
  'color-text-inverse': constants.white,
  'color-text-link': b[5],

  /* Lines ------------------------------------------------------------- */
  'color-border': g[3],
  'color-border-strong': g[4],
  'color-border-subtle': g[2],

  /* Elevation --------------------------------------------------------- */
  'shadow-1': '0 1px 2px rgba(24, 28, 38, 0.06), 0 1px 3px rgba(24, 28, 38, 0.08)',
  'shadow-2': '0 4px 10px rgba(24, 28, 38, 0.08), 0 1px 3px rgba(24, 28, 38, 0.06)',
  'shadow-3': '0 12px 32px rgba(24, 28, 38, 0.14), 0 2px 8px rgba(24, 28, 38, 0.08)',
};

export const darkTokens: SemanticTokens = {
  'color-brand': b[4],
  'color-brand-hover': b[3],
  'color-brand-active': b[5],
  'color-brand-subtle': 'rgba(95, 153, 251, 0.16)',
  'color-brand-border': b[7],
  'color-on-brand': g[9],

  'color-success': s[4],
  'color-success-subtle': 'rgba(60, 189, 120, 0.16)',
  'color-warning': o[4],
  'color-warning-subtle': 'rgba(251, 147, 58, 0.16)',
  'color-danger': r[4],
  'color-danger-hover': r[3],
  'color-danger-active': r[5],
  'color-danger-subtle': 'rgba(233, 98, 98, 0.16)',
  'color-on-status': g[9],

  'color-bg-page': '#12151d',
  'color-bg-container': '#181c26',
  'color-bg-elevated': '#20252f',
  'color-bg-subtle': '#20252f',
  'color-bg-hover': 'rgba(255, 255, 255, 0.08)',
  'color-bg-active': 'rgba(255, 255, 255, 0.14)',
  'color-bg-disabled': 'rgba(255, 255, 255, 0.06)',
  'color-bg-mask': 'rgba(0, 0, 0, 0.7)',

  'color-text-primary': '#e9ecf2',
  'color-text-secondary': g[4],
  'color-text-placeholder': g[6],
  'color-text-disabled': g[7],
  'color-text-inverse': g[9],
  'color-text-link': b[4],

  'color-border': 'rgba(255, 255, 255, 0.16)',
  'color-border-strong': 'rgba(255, 255, 255, 0.28)',
  'color-border-subtle': 'rgba(255, 255, 255, 0.08)',

  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.5)',
  'shadow-2': '0 4px 10px rgba(0, 0, 0, 0.55)',
  'shadow-3': '0 12px 32px rgba(0, 0, 0, 0.6)',
};
