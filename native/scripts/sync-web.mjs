import { cp, mkdir, rm } from 'node:fs/promises';
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
console.log(`Synced ${source} -> ${target}`);
