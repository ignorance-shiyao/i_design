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

  'font-size-xs': '11px',
  'font-size-s': '12px',
  'font-size-m': '13px',
  'font-size-l': '15px',
  'font-size-xl': '18px',
  'font-size-2xl': '22px',
  'font-size-3xl': '28px',

  'font-weight-regular': '400',
  'font-weight-medium': '500',
  'font-weight-semibold': '580',
  'font-weight-bold': '650',

  'line-height-tight': '1.25',
  'line-height-snug': '1.4',
  'line-height-base': '1.6',

  /* Optical tracking: tighter as type grows, looser for small caps labels. */
  'tracking-tight': '-0.014em',
  'tracking-normal': '0',
  'tracking-wide': '0.02em',
  'tracking-caps': '0.06em',

  'radius-xs': '4px',
  'radius-s': '6px',
  'radius-m': '8px',
  'radius-l': '12px',
  'radius-xl': '16px',
  'radius-round': '999px',

  'border-width': '1px',
  'focus-ring-width': '3px',
  'focus-ring-offset': '1px',

  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-5': '24px',
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
  'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  'ease-enter': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  'ease-exit': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  'ease-emphasized': 'cubic-bezier(0.34, 1.4, 0.5, 1)',
  'ease-linear': 'linear',

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
    'control-height-s': '24px',
    'control-height-m': '30px',
    'control-height-l': '36px',
    'control-padding-x': '10px',
    'control-gap': '6px',
    'block-padding': '12px',
  },
  default: {
    'control-height-s': '28px',
    'control-height-m': '36px',
    'control-height-l': '44px',
    'control-padding-x': '14px',
    'control-gap': '8px',
    'block-padding': '16px',
  },
  loose: {
    'control-height-s': '34px',
    'control-height-m': '44px',
    'control-height-l': '52px',
    'control-padding-x': '18px',
    'control-gap': '10px',
    'block-padding': '24px',
  },
};
