export * from './palette.js';
export * from './semantic.js';
export * from './shape.js';

import { lightTokens, darkTokens, type SemanticTokens } from './semantic.js';
import { shapeTokens, densityTokens, type Density } from './shape.js';
import { primitiveVars } from './palette.js';

/** CSS custom property prefix. Every token is emitted as `--i-<key>`. */
export const TOKEN_PREFIX = '--i-';

export const toCssVarName = (key: string): string => `${TOKEN_PREFIX}${key}`;

/** Flattens a token record into `{ '--i-color-brand': '#...' }` form. */
export function toCssVars(tokens: SemanticTokens): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) out[toCssVarName(key)] = value;
  return out;
}

export type ColorScheme = 'light' | 'dark';

/**
 * The complete semantic token set for one (scheme, density) combination.
 *
 * Colour values are `rgba(var(--i-…), a)` references, not resolved colours —
 * they only mean something inside a document that also carries the primitive
 * layer. Use `readComputedTokens()` from @i-design/core when you need concrete
 * values (for a canvas or a charting library).
 */
export function resolveTokens(scheme: ColorScheme, density: Density = 'default'): SemanticTokens {
  return {
    ...shapeTokens,
    ...densityTokens[density],
    ...(scheme === 'dark' ? darkTokens : lightTokens),
  };
}

export { primitiveVars };
