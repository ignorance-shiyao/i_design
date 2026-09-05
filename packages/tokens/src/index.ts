export * from './palette.js';
export * from './semantic.js';
export * from './shape.js';

import { lightTokens, darkTokens, type SemanticTokens } from './semantic.js';
import { shapeTokens, densityTokens, type Density } from './shape.js';

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

/** The complete token set for one (scheme, density) combination. */
export function resolveTokens(scheme: ColorScheme, density: Density = 'default'): SemanticTokens {
  return {
    ...shapeTokens,
    ...densityTokens[density],
    ...(scheme === 'dark' ? darkTokens : lightTokens),
  };
}
