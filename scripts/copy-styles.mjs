/** Copies each package's hand-written CSS into its dist folder after tsc. */
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = process.argv[2];
const from = resolve(process.cwd(), 'src/styles');
const to = resolve(process.cwd(), 'dist/styles');
if (!existsSync(from)) process.exit(0);
await mkdir(to, { recursive: true });
await cp(from, to, { recursive: true });
console.log(`[${pkg}] copied styles -> dist/styles`);
