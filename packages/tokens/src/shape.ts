import type { SemanticTokens } from './semantic.js';

/** Typography, spacing, radius and motion — shared across colour schemes. */
export const shapeTokens: SemanticTokens = {
  /*
   * Type. The UI stack leads with the platform faces so text renders native on
   * each OS; the display stack adds tighter tracking for headings.
   */
  'font-family':
    "-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', Inter, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif",
  'font-family-display':
    "-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Display', 'Segoe UI', Inter, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif",
  'font-family-mono':
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace",

  /* 12 / 14 body, 16→32 headings — the scale Semi settled on, and it reads well
     for CJK, where 13px stems get muddy. */
  'font-size-xs': '12px',
  'font-size-s': '12px',
  'font-size-m': '14px',
  'font-size-l': '16px',
  'font-size-xl': '20px',
  'font-size-2xl': '24px',
  'font-size-3xl': '32px',

  'font-weight-regular': '400',
  'font-weight-medium': '500',
  'font-weight-semibold': '600',
  'font-weight-bold': '600',

  'line-height-tight': '1.25',
  'line-height-snug': '1.4',
  'line-height-base': '1.6',

  /* Optical tracking: tighter as type grows, looser for small caps labels. */
  'tracking-tight': '-0.014em',
  'tracking-normal': '0',
  'tracking-wide': '0.02em',
  'tracking-caps': '0.06em',

  /* Tight radii: 3 / 6 / 12. Large soft corners make dense UI look inflated. */
  'radius-xs': '2px',
  'radius-s': '3px',
  'radius-m': '6px',
  'radius-l': '12px',
  'radius-xl': '12px',
  'radius-round': '9999px',

  'border-width': '1px',
  'focus-ring-width': '3px',
  'focus-ring-offset': '1px',

  'space-0': '2px',
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-5': '20px',
  'space-6': '32px',
  'space-7': '48px',
  'space-8': '64px',

  /*
   * Motion. `ease-standard` is the workhorse; `ease-emphasized` overshoots
   * slightly for elements that enter, which is what makes an overlay feel
   * placed rather than faded in.
   */
  'duration-instant': '80ms',
  'duration-fast': '140ms',
  'duration-base': '220ms',
  'duration-slow': '360ms',
  'duration-slower': '560ms',

  /*
   * Two motion families, the distinction Carbon draws: *productive* motion is
   * for things the user does repeatedly and should not have to wait on;
   * *expressive* motion is for moments that deserve attention. The curves are
   * Carbon's published values.
   */
  'ease-standard': 'cubic-bezier(0.2, 0, 0.38, 0.9)',
  'ease-enter': 'cubic-bezier(0, 0, 0.38, 0.9)',
  'ease-exit': 'cubic-bezier(0.2, 0, 1, 0.9)',
  'ease-expressive-standard': 'cubic-bezier(0.4, 0.14, 0.3, 1)',
  'ease-expressive-enter': 'cubic-bezier(0, 0, 0.3, 1)',
  'ease-expressive-exit': 'cubic-bezier(0.4, 0.14, 1, 1)',
  /** Slight overshoot, for elements that should feel placed rather than faded. */
  'ease-emphasized': 'cubic-bezier(0.34, 1.4, 0.5, 1)',
  'ease-linear': 'linear',

  /*
   * State layers, the Material approach: instead of a hand-picked hover colour
   * per variant, overlay the *content* colour at a fixed opacity. Every
   * interactive surface then reacts identically, including on coloured grounds.
   */
  'state-hover': '0.06',
  'state-focus': '0.1',
  'state-pressed': '0.12',
  'state-selected': '0.1',
  'state-dragged': '0.16',
  'state-disabled-content': '0.38',
  'state-disabled-surface': '0.06',

  'z-index-sticky': '1000',
  'z-index-popup': '5000',
  'z-index-dialog': '6000',
  'z-index-message': '7000',
};

/**
 * Density is a first-class axis (not just a `size` prop): it rescales the
 * control height and inner padding of *every* component at once, which is what
 * makes a data-dense console and a marketing page share the same library.
 */
export type Density = 'compact' | 'default' | 'loose';

export const densityTokens: Record<Density, SemanticTokens> = {
  compact: {
    'control-height-s': '20px',
    'control-height-m': '28px',
    'control-height-l': '34px',
    'control-padding-x': '8px',
    'control-gap': '6px',
    'block-padding': '12px',
  },
  /* 24 / 32 / 40 — the control rhythm most enterprise systems converge on. */
  default: {
    'control-height-s': '24px',
    'control-height-m': '32px',
    'control-height-l': '40px',
    'control-padding-x': '12px',
    'control-gap': '8px',
    'block-padding': '16px',
  },
  loose: {
    'control-height-s': '28px',
    'control-height-m': '40px',
    'control-height-l': '48px',
    'control-padding-x': '16px',
    'control-gap': '10px',
    'block-padding': '20px',
  },
};
