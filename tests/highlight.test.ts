import { describe, expect, it } from 'vitest';
import { highlight, tokenClass } from '@i-design/core';

const typesOf = (code: string, lang: string) =>
  highlight(code, lang).map((token) => `${token.type}:${token.value}`);
const joined = (code: string, lang: string) =>
  highlight(code, lang).map((token) => token.value).join('');

describe('syntax tokenizer', () => {
  it('never loses or reorders a character', () => {
    const samples: Array<[string, string]> = [
      [`const a = 'x'; // done`, 'ts'],
      [`<div class="a">{{ v }}</div>`, 'vue'],
      [`.a { color: red; }`, 'css'],
      [`pnpm add -D vite # install`, 'bash'],
      ['', 'ts'],
    ];
    for (const [code, lang] of samples) expect(joined(code, lang)).toBe(code);
  });

  it('marks keywords, strings and comments in script', () => {
    const tokens = typesOf(`const x = 'hi'; // note`, 'ts');
    expect(tokens).toContain('keyword:const');
    expect(tokens).toContain(`string:'hi'`);
    expect(tokens).toContain('comment:// note');
  });

  it('does not start a string inside a comment', () => {
    // An apostrophe in a comment used to swallow the rest of the file.
    const tokens = highlight(`// it's fine\nconst a = 1;`, 'ts');
    expect(tokens[0]).toEqual({ type: 'comment', value: `// it's fine` });
    expect(tokens.some((token) => token.type === 'keyword' && token.value === 'const')).toBe(true);
  });

  it('handles JSX tags and template literals', () => {
    const tokens = typesOf('<Button status="brand">ok</Button>', 'tsx');
    expect(tokens).toContain('tag:<Button');
    expect(tokens).toContain('attr:status');
    expect(joined('`a ${b} c`', 'ts')).toBe('`a ${b} c`');
  });

  it('reads Vue directives as attributes', () => {
    const tokens = typesOf(`<IInput v-model="value" :maxlength="40" @blur="f" />`, 'vue');
    expect(tokens.some((t) => t.startsWith('attr:v-model'))).toBe(true);
    expect(tokens.some((t) => t.startsWith('attr::maxlength'))).toBe(true);
    expect(tokens.some((t) => t.startsWith('attr:@blur'))).toBe(true);
  });

  it('picks out CSS custom properties and units', () => {
    const tokens = typesOf('.a { --i-x: 12px; }', 'css');
    expect(tokens).toContain('attr:--i-x');
    expect(tokens).toContain('number:12px');
  });

  it('leaves unknown languages as a single plain run', () => {
    expect(highlight('anything at all', 'text')).toEqual([{ type: 'plain', value: 'anything at all' }]);
  });

  it('merges adjacent runs of the same type', () => {
    const tokens = highlight('a b c', 'ts');
    expect(tokens.filter((token) => token.type === 'plain').length).toBeLessThan(5);
  });

  it('names token classes for the stylesheet', () => {
    expect(tokenClass('keyword')).toBe('i-code-block__token i-code-block__token--keyword');
  });
});
