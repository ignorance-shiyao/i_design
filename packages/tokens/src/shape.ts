import type { SemanticTokens } from './semantic.js';

/** Typography, spacing, radius and motion — shared across colour schemes. */
export const shapeTokens: SemanticTokens = {
  'font-family':
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif",
  'font-family-mono': "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  'font-size-s': '12px',
  'font-size-m': '14px',
  'font-size-l': '16px',
  'font-size-xl': '20px',
  'font-weight-regular': '400',
  'font-weight-medium': '500',
  'font-weight-bold': '600',
  'line-height-tight': '1.3',
  'line-height-base': '1.5',

  'radius-s': '3px',
  'radius-m': '6px',
  'radius-l': '10px',
  'radius-round': '999px',

  'border-width': '1px',
  'focus-ring-width': '2px',
  'focus-ring-offset': '2px',

  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-5': '24px',
  'space-6': '32px',

  'duration-fast': '120ms',
  'duration-base': '200ms',
  'duration-slow': '320ms',
  'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  'ease-enter': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-exit': 'cubic-bezier(0.4, 0, 1, 1)',

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
    'control-height-m': '28px',
    'control-height-l': '34px',
    'control-padding-x': '8px',
    'control-gap': '4px',
  },
  default: {
    'control-height-s': '28px',
    'control-height-m': '34px',
    'control-height-l': '42px',
    'control-padding-x': '12px',
    'control-gap': '6px',
  },
  loose: {
    'control-height-s': '34px',
    'control-height-m': '42px',
    'control-height-l': '50px',
    'control-padding-x': '16px',
    'control-gap': '8px',
  },
};
