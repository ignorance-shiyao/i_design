/** Run after build: verify consumer exports without development source aliases. */
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../playground/demo/package.json', import.meta.url));
for (const name of ['tokens', 'core', 'react', 'vue']) {
  const manifest = JSON.parse(await readFile(new URL(`../packages/${name}/package.json`, import.meta.url), 'utf8'));
  for (const [entry, target] of Object.entries(manifest.exports)) {
    if (entry.includes('*')) continue;
    const resolved = require.resolve(`@i-design/${name}${entry === '.' ? '' : entry.slice(1)}`);
    await access(resolved);
    if (typeof target === 'object' && target.types) await access(new URL(`../packages/${name}/${target.types}`, import.meta.url));
  }
  if (name === 'react' || name === 'vue') {
    const exports = await import(new URL(`../packages/${name}/dist/index.js`, import.meta.url));
    for (const component of ['ApprovalCard', 'ToolChip', 'TaskList', 'ContextCard']) assert.ok(exports[component], `${name}: missing ${component}`);
    const css = await readFile(require.resolve(`@i-design/${name}/styles`), 'utf8');
    assert.match(css, /@import ['"]@i-design\/core\/styles['"]/);
  }
}
const coreStyles = await readFile(require.resolve('@i-design/core/styles'), 'utf8');
assert.match(coreStyles, /@import ['"]\.\/agent.css['"]/);
await access(require.resolve('@i-design/core/styles/agent.css'));
console.log('Package exports, declarations, agent components and CSS entries verified.');
