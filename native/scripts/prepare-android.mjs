import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const nativeRoot = resolve(here, '..');
const androidRoot = resolve(nativeRoot, 'android');
const javaTarget = resolve(androidRoot, 'app/src/main/java/com/moldavite/mrdarkness');
const pluginSource = resolve(nativeRoot, 'android-plugin');

function run(command, args, cwd = nativeRoot) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status || 1);
}

run('node', [resolve(here, 'sync-web.mjs')]);

try {
  await access(androidRoot);
} catch {
  run('npx', ['cap', 'add', 'android']);
}

await mkdir(javaTarget, { recursive: true });
for (const name of ['ChatGPTPlanPlugin.java', 'LoopbackCallbackServer.java', 'MainActivity.java']) {
  await cp(resolve(pluginSource, name), resolve(javaTarget, name));
}

// ChatGPT plan-sharing currently requires Responses API `input` to be an array.
// Keep the readable source plugin simple, then enforce the current OpenAI contract in the generated Android source.
const generatedPlugin = resolve(javaTarget, 'ChatGPTPlanPlugin.java');
let pluginJava = await readFile(generatedPlugin, 'utf8');
const oldInputLine = '        payload.put("input", input);';
const newInputLine = '        payload.put("input", new JSONArray().put(new JSONObject().put("role", "user").put("content", input)));';
if (!pluginJava.includes(oldInputLine)) {
  throw new Error('Could not patch ChatGPTPlanPlugin.java: expected Responses input line was not found.');
}
pluginJava = pluginJava.replace(oldInputLine, newInputLine);
await writeFile(generatedPlugin, pluginJava, 'utf8');

const gradlePath = resolve(androidRoot, 'app/build.gradle');
let gradle = await readFile(gradlePath, 'utf8');
const marker = '// MR_DARKNESS_CHATGPT_PLAN_DEPENDENCIES';
if (!gradle.includes(marker)) {
  gradle = gradle.replace(/dependencies\s*\{/, match => `${match}\n    ${marker}\n    implementation "androidx.security:security-crypto:1.1.0"\n    implementation "com.squareup.okhttp3:okhttp:4.12.0"\n    implementation "com.nimbusds:nimbus-jose-jwt:10.10"`);
  await writeFile(gradlePath, gradle, 'utf8');
}

run('npx', ['cap', 'sync', 'android']);
console.log('Mr Darkness Android shell prepared with verified local ChatGPT plan-sharing bridge.');
