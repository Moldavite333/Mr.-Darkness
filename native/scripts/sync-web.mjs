import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const nativeRoot = resolve(here, '..');
const repoRoot = resolve(nativeRoot, '..');
const source = resolve(repoRoot, 'v3');
const target = resolve(nativeRoot, 'www');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

// Keep the main V3 HTML stable while allowing focused UI patches to ship in
// the Android shell. These files are copied with the rest of v3 above.
const indexPath = resolve(target, 'index.html');
let html = await readFile(indexPath, 'utf8');
if (!html.includes('brain-output.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="brain-output.css">\n</head>');
}
if (!html.includes('brain-output.js')) {
  html = html.replace('</body>', '  <script src="brain-output.js" defer></script>\n</body>');
}
await writeFile(indexPath, html, 'utf8');

console.log(`Synced ${source} -> ${target} with brain output copy UI`);
