import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = path.join(root, 'js/vendor');
await mkdir(vendor, { recursive: true });
const source = await readFile(path.join(root, 'node_modules/particles.js/particles.js'), 'utf8');
const result = await transform(source, { minify: true, legalComments: 'none' });
await writeFile(path.join(vendor, 'particles.min.js'), '/*! particles.js 2.0.0 | MIT | Copyright 2014 Vincent Garreau | See particles.LICENSE.md */\n' + result.code);
await writeFile(path.join(vendor, 'particles.LICENSE.md'), (await readFile(path.join(root, 'node_modules/particles.js/LICENSE.md'), 'utf8')).replace(/\r\n/g, '\n'));
console.log('Generated the original licensed homepage effect from the pinned npm package.');
