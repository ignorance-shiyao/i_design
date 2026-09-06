/**
 * Bundles the playground into ONE self-contained HTML file.
 *
 * The Artifact sandbox serves a single document and blocks external assets, so
 * the CSS and the JS chunk are inlined rather than linked. Everything else —
 * markup, theme handling, the demo itself — is exactly what `vite build` produced.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'playground/demo/dist');
const assets = await readdir(resolve(dist, 'assets'));
const cssFile = assets.find((f) => f.endsWith('.css'));
const jsFile = assets.find((f) => f.endsWith('.js'));
if (!cssFile || !jsFile) throw new Error('build the playground first: pnpm --filter @i-design/playground build');

const [html, css, js] = await Promise.all([
  readFile(resolve(dist, 'index.html'), 'utf8'),
  readFile(resolve(dist, 'assets', cssFile), 'utf8'),
  readFile(resolve(dist, 'assets', jsFile), 'utf8'),
]);

// Take the body markup from the built index.html; drop its asset <link>/<script>.
const body = html
  .slice(html.indexOf('<body>') + '<body>'.length, html.indexOf('</body>'))
  .replace(/<script[^>]*><\/script>/g, '')
  .trim();

const page = `<title>i-design 组件预览</title>
<style>
${css}
/* Artifact host: the page owns the full viewport and paints its own ground. */
html, body { min-block-size: 100%; }
body { margin: 0; background: var(--i-color-bg-page); color: var(--i-color-text-primary); }
</style>

${body}

<script type="module">
${js}
</script>
`;

await writeFile(resolve(process.cwd(), 'playground/demo/dist/artifact.html'), page, 'utf8');
console.log(`[artifact] wrote playground/demo/dist/artifact.html (${(page.length / 1024).toFixed(0)} KB)`);
