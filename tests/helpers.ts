export {
  computePosition, createBem, cx, useButtonBehavior, useInputBehavior, useToggleBehavior,
} from '@i-design/core';
import { darkTokens, lightTokens } from '@i-design/tokens';

/** Both colour schemes must define exactly the same token names, or theming breaks. */
export const resolveTokensSafe = () => ({ light: lightTokens, dark: darkTokens });
