import { alpha } from './palette.js';

/**
 * Semantic tokens are the only layer components may consume.
 * Keys become CSS custom properties with the `--i-` prefix.
 *
 * Almost every value is `rgba(var(--i-<hue>-<step>), a)`, so a theme is defined
 * by the primitive triplets plus a set of alphas. Two consequences worth the
 * indirection: hover/fill/border states stay in the same hue family by
 * construction, and a rebrand is a handful of triplets rather than a hex hunt.
 */
export type SemanticTokens = Record<string, string>;

const grey = (step: number, a = 1): string => alpha(`--i-grey-${step}`, a);
const brand = (step: number, a = 1): string => alpha(`--i-brand-${step}`, a);
const green = (step: number, a = 1): string => alpha(`--i-green-${step}`, a);
const red = (step: number, a = 1): string => alpha(`--i-red-${step}`, a);
const amber = (step: number, a = 1): string => alpha(`--i-amber-${step}`, a);
const white = (a = 1): string => alpha('--i-white', a);
const surface = (step: number, a = 1): string => alpha(`--i-surface-${step}`, a);

export const lightTokens: SemanticTokens = {
  /* Brand ------------------------------------------------------------- */
  'color-brand': brand(5),
  'color-brand-hover': brand(4),
  'color-brand-active': brand(6),
  'color-brand-subtle': brand(5, 0.08),
  'color-brand-subtle-hover': brand(5, 0.14),
  'color-brand-border': brand(5, 0.28),
  'color-brand-text': brand(6),
  'color-on-brand': white(),

  /* Status ------------------------------------------------------------ */
  'color-success': green(5),
  'color-success-text': green(6),
  'color-success-subtle': green(5, 0.1),
  'color-success-border': green(5, 0.28),
  'color-warning': amber(5),
  'color-warning-text': amber(6),
  'color-warning-subtle': amber(5, 0.12),
  'color-warning-border': amber(5, 0.3),
  'color-danger': red(5),
  'color-danger-hover': red(4),
  'color-danger-active': red(6),
  'color-danger-text': red(6),
  'color-danger-subtle': red(5, 0.09),
  'color-danger-border': red(5, 0.26),
  'color-on-status': white(),

  /*
   * Surfaces. `page` sits under `container`, which sits under `elevated` —
   * an explicit stacking order rather than a bag of greys.
   */
  'color-bg-page': grey(0),
  'color-bg-container': white(),
  'color-bg-elevated': white(),
  'color-bg-raised': white(),
  'color-bg-subtle': grey(9, 0.03),
  'color-bg-muted': grey(9, 0.05),
  'color-bg-hover': grey(9, 0.05),
  'color-bg-active': grey(9, 0.09),
  'color-bg-disabled': grey(9, 0.04),
  'color-bg-inverse': grey(9),
  'color-bg-mask': grey(9, 0.45),

  /* Text: one hue, four weights of presence. */
  'color-text-primary': grey(9),
  'color-text-secondary': grey(9, 0.66),
  'color-text-tertiary': grey(9, 0.45),
  'color-text-placeholder': grey(9, 0.32),
  'color-text-disabled': grey(9, 0.28),
  'color-text-inverse': white(),
  'color-text-link': brand(6),

  /* Lines */
  'color-border': grey(9, 0.11),
  'color-border-strong': grey(9, 0.2),
  'color-border-subtle': grey(9, 0.07),
  'color-ring': brand(5, 0.28),

  /* Elevation: a hairline plus one soft ambient layer. */
  'shadow-1': `0 1px 2px ${grey(9, 0.05)}`,
  'shadow-2': `0 0 1px ${grey(9, 0.16)}, 0 2px 8px ${grey(9, 0.07)}`,
  'shadow-3': `0 0 1px ${grey(9, 0.18)}, 0 6px 18px ${grey(9, 0.1)}`,
  'shadow-4': `0 0 1px ${grey(9, 0.2)}, 0 14px 40px ${grey(9, 0.16)}`,
  'shadow-highlight': `inset 0 1px 0 ${white(0.14)}`,
};

export const darkTokens: SemanticTokens = {
  'color-brand': brand(4),
  'color-brand-hover': brand(3),
  'color-brand-active': brand(5),
  'color-brand-subtle': brand(4, 0.16),
  'color-brand-subtle-hover': brand(4, 0.24),
  'color-brand-border': brand(4, 0.38),
  'color-brand-text': brand(3),
  'color-on-brand': surface(0),

  'color-success': green(4),
  'color-success-text': green(3),
  'color-success-subtle': green(4, 0.16),
  'color-success-border': green(4, 0.34),
  'color-warning': amber(4),
  'color-warning-text': amber(3),
  'color-warning-subtle': amber(4, 0.16),
  'color-warning-border': amber(4, 0.34),
  'color-danger': red(4),
  'color-danger-hover': red(3),
  'color-danger-active': red(5),
  'color-danger-text': red(3),
  'color-danger-subtle': red(4, 0.16),
  'color-danger-border': red(4, 0.34),
  'color-on-status': surface(0),

  'color-bg-page': surface(0),
  'color-bg-container': surface(1),
  'color-bg-elevated': surface(2),
  'color-bg-raised': surface(3),
  'color-bg-subtle': white(0.02),
  'color-bg-muted': white(0.05),
  'color-bg-hover': white(0.06),
  'color-bg-active': white(0.1),
  'color-bg-disabled': white(0.04),
  'color-bg-inverse': grey(0),
  'color-bg-mask': alpha('--i-black', 0.6),

  'color-text-primary': white(0.92),
  'color-text-secondary': white(0.62),
  'color-text-tertiary': white(0.45),
  'color-text-placeholder': white(0.34),
  'color-text-disabled': white(0.28),
  'color-text-inverse': grey(9),
  'color-text-link': brand(3),

  'color-border': white(0.12),
  'color-border-strong': white(0.22),
  'color-border-subtle': white(0.07),
  'color-ring': brand(4, 0.4),

  /*
   * On dark grounds an inset hairline separates surfaces better than a drop
   * shadow — the trick Semi uses, and it survives on any background.
   */
  'shadow-1': `inset 0 0 0 1px ${white(0.04)}`,
  'shadow-2': `inset 0 0 0 1px ${white(0.06)}, 0 2px 8px ${alpha('--i-black', 0.32)}`,
  'shadow-3': `inset 0 0 0 1px ${white(0.08)}, 0 6px 18px ${alpha('--i-black', 0.4)}`,
  'shadow-4': `inset 0 0 0 1px ${white(0.1)}, 0 14px 40px ${alpha('--i-black', 0.5)}`,
  'shadow-highlight': `inset 0 1px 0 ${white(0.06)}`,
};
