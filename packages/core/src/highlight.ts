/**
 * A small, dependency-free syntax tokenizer.
 *
 * Highlighting belongs in core for the same reason everything else does: the
 * React and Vue `<CodeBlock>` must emit identical markup. It is deliberately a
 * *tokenizer*, not a parser — docs snippets need the shape of the code, not a
 * type-correct AST — and it keeps the library's zero-runtime-dependency promise.
 */
export type CodeTokenType =
  | 'plain' | 'comment' | 'string' | 'keyword' | 'number'
  | 'tag' | 'attr' | 'function' | 'property' | 'punctuation' | 'operator';

export interface CodeToken {
  type: CodeTokenType;
  value: string;
}

export type HighlightLanguage = 'tsx' | 'ts' | 'js' | 'jsx' | 'vue' | 'html' | 'css' | 'json' | 'bash' | 'text';

const KEYWORDS = new Set([
  'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'return',
  'if', 'else', 'for', 'while', 'of', 'in', 'new', 'class', 'extends', 'this', 'super',
  'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'delete',
  'void', 'yield', 'interface', 'type', 'enum', 'implements', 'readonly', 'as', 'satisfies',
  'public', 'private', 'protected', 'static', 'declare', 'namespace', 'true', 'false',
  'null', 'undefined', 'switch', 'case', 'break', 'continue', 'do',
]);

/** Language families that share a scanner. */
function familyOf(language: string): 'markup' | 'style' | 'shell' | 'script' {
  if (language === 'vue' || language === 'html') return 'markup';
  if (language === 'css' || language === 'scss') return 'style';
  if (language === 'bash' || language === 'sh' || language === 'shell') return 'shell';
  return 'script';
}

/*
 * One ordered alternation per family. Order is the whole design: comments and
 * strings must win over everything, or an apostrophe inside a comment starts a
 * bogus string that swallows the rest of the file.
 */
const SCRIPT = new RegExp(
  [
    '(?<comment>\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',
    '(?<string>`(?:\\\\.|[^`\\\\])*`|\'(?:\\\\.|[^\'\\\\\\n])*\'|"(?:\\\\.|[^"\\\\\\n])*")',
    '(?<tag><\\/?[A-Za-z][\\w.-]*|\\/?>)',
    '(?<number>\\b\\d+(?:\\.\\d+)?\\b)',
    '(?<attr>[A-Za-z_$][\\w$-]*(?=\\s*=(?!=))|[A-Za-z_$][\\w$]*(?=\\s*:))',
    '(?<function>[A-Za-z_$][\\w$]*(?=\\s*\\())',
    '(?<word>[A-Za-z_$][\\w$]*)',
    '(?<punctuation>[{}()\\[\\];,.])',
    '(?<operator>[=+\\-*/%<>!&|?:]+)',
  ].join('|'),
  'g',
);

const MARKUP = new RegExp(
  [
    '(?<comment><!--[\\s\\S]*?-->)',
    '(?<string>"(?:[^"]*)"|\'(?:[^\']*)\')',
    '(?<tag><\\/?[A-Za-z][\\w.-]*|\\/?>)',
    '(?<attr>[@:#v-]?[A-Za-z_][\\w:.-]*(?=\\s*=)|[@:][A-Za-z_][\\w:.-]*)',
    '(?<punctuation>[{}()\\[\\];,]|\\{\\{|\\}\\})',
  ].join('|'),
  'g',
);

const STYLE = new RegExp(
  [
    '(?<comment>\\/\\*[\\s\\S]*?\\*\\/)',
    '(?<string>"(?:[^"]*)"|\'(?:[^\']*)\')',
    '(?<attr>--[\\w-]+|[.#][\\w-]+|@[\\w-]+)',
    '(?<property>[a-z-]+(?=\\s*:))',
    '(?<number>\\b\\d+(?:\\.\\d+)?(?:px|rem|em|%|s|ms|fr|vh|vw)?\\b)',
    '(?<function>[A-Za-z-]+(?=\\())',
    '(?<punctuation>[{}();,:])',
  ].join('|'),
  'g',
);

const SHELL = new RegExp(
  [
    '(?<comment>#[^\\n]*)',
    '(?<string>"(?:[^"]*)"|\'(?:[^\']*)\')',
    '(?<keyword>\\b(?:pnpm|npm|yarn|npx|node|git|cd|run|install|add)\\b)',
    '(?<attr>--?[\\w-]+)',
  ].join('|'),
  'g',
);

const SCANNERS = { script: SCRIPT, markup: MARKUP, style: STYLE, shell: SHELL };

/** Splits `code` into typed tokens. Unknown languages come back as one plain run. */
export function highlight(code: string, language: HighlightLanguage | string = 'text'): CodeToken[] {
  if (language === 'text' || language === 'plain') return [{ type: 'plain', value: code }];

  const scanner = SCANNERS[familyOf(language)];
  scanner.lastIndex = 0;

  const tokens: CodeToken[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  const push = (type: CodeTokenType, value: string): void => {
    if (!value) return;
    const previous = tokens[tokens.length - 1];
    // Merge neighbours of the same type so the DOM stays small.
    if (previous && previous.type === type) previous.value += value;
    else tokens.push({ type, value });
  };

  while ((match = scanner.exec(code)) !== null) {
    // Zero-width matches would loop forever.
    if (match[0] === '') {
      scanner.lastIndex += 1;
      continue;
    }
    if (match.index > last) push('plain', code.slice(last, match.index));

    const groups = (match.groups ?? {}) as Record<string, string | undefined>;
    const name = Object.keys(groups).find((key) => groups[key] !== undefined);

    if (name === 'word') {
      push(KEYWORDS.has(match[0]) ? 'keyword' : 'plain', match[0]);
    } else if (name) {
      push(name as CodeTokenType, match[0]);
    } else {
      push('plain', match[0]);
    }
    last = match.index + match[0].length;
  }

  if (last < code.length) push('plain', code.slice(last));
  return tokens;
}

/** Class name for a token, e.g. `i-code-block__token--keyword`. */
export function tokenClass(type: CodeTokenType): string {
  return `i-code-block__token i-code-block__token--${type}`;
}
