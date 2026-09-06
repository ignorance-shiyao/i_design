import { resolveTokens, toCssVars, type ColorScheme, type Density } from '@i-design/tokens';
import { isBrowser } from './env.js';

export type ThemeMode = ColorScheme | 'auto';
export type Direction = 'ltr' | 'rtl';

export interface ThemeConfig {
  /** `auto` follows `prefers-color-scheme` at the CSS level (no JS needed). */
  mode: ThemeMode;
  density: Density;
  dir: Direction;
  /**
   * Ad-hoc token overrides, e.g. `{ 'color-brand': '#7c3aed' }`.
   * Applied as inline custom properties on the theme root, so a sub-tree can be
   * rebranded without a rebuild — this is the "runtime theming" story.
   */
  tokens?: Record<string, string>;
}

export const defaultTheme: ThemeConfig = { mode: 'light', density: 'default', dir: 'ltr' };

export interface ThemeAttributes {
  'data-i-theme': ThemeMode;
  'data-i-density': Density;
  dir: Direction;
}

/** The attributes a theme provider must render on its root element. */
export function themeAttributes(config: Partial<ThemeConfig> = {}): ThemeAttributes {
  const { mode, density, dir } = { ...defaultTheme, ...config };
  return { 'data-i-theme': mode, 'data-i-density': density, dir };
}

/** Inline style object carrying the per-subtree token overrides. */
export function themeStyle(config: Partial<ThemeConfig> = {}): Record<string, string> {
  return config.tokens ? toCssVars(config.tokens) : {};
}

/**
 * Imperative escape hatch for apps that theme the whole document rather than a
 * React/Vue sub-tree (and for portalled content such as dialogs and messages).
 */
export function applyTheme(config: Partial<ThemeConfig> = {}, target?: HTMLElement): void {
  if (!isBrowser) return;
  const el = target ?? document.documentElement;
  const attrs = themeAttributes(config);
  el.setAttribute('data-i-theme', attrs['data-i-theme']);
  el.setAttribute('data-i-density', attrs['data-i-density']);
  el.setAttribute('dir', attrs.dir);
  for (const [name, value] of Object.entries(themeStyle(config))) el.style.setProperty(name, value);
}

/**
 * Reads the *computed* value of every semantic token from a live element.
 *
 * Token colours are `rgba(var(--i-…), a)` references, so they only resolve
 * inside a document. This is the honest way to hand real colours to a canvas or
 * a charting library; `computedTokens()` returns the references themselves.
 */
export function readComputedTokens(target?: HTMLElement): Record<string, string> {
  if (!isBrowser) return {};
  const el = target ?? document.documentElement;
  const styles = getComputedStyle(el);
  const out: Record<string, string> = {};
  for (const key of Object.keys(resolveTokens('light'))) {
    const value = styles.getPropertyValue(`--i-${key}`).trim();
    if (value) out[key] = value;
  }
  return out;
}

/** The token *references* for a scheme; see `readComputedTokens` for real values. */
export function computedTokens(config: Partial<ThemeConfig> = {}): Record<string, string> {
  const { mode, density, tokens } = { ...defaultTheme, ...config };
  const scheme: ColorScheme =
    mode === 'auto'
      ? isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  return { ...resolveTokens(scheme, density), ...(tokens ?? {}) };
}

export type { ColorScheme, Density };
