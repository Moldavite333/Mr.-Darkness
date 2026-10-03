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

// Enforce current OpenAI Responses contract and Android browser behavior in the generated native source.
const generatedPlugin = resolve(javaTarget, 'ChatGPTPlanPlugin.java');
let pluginJava = await readFile(generatedPlugin, 'utf8');

const oldInputLine = '        payload.put("input", input);';
const newInputLine = '        payload.put("input", new JSONArray().put(new JSONObject().put("role", "user").put("content", input)));';
if (!pluginJava.includes(oldInputLine)) {
  throw new Error('Could not patch ChatGPTPlanPlugin.java: expected Responses input line was not found.');
}
pluginJava = pluginJava.replace(oldInputLine, newInputLine);

// OpenAI requires the system browser for the open-source Sign in with ChatGPT loopback flow.
// A generic ACTION_VIEW can be claimed by the ChatGPT Android app, preventing the 127.0.0.1 callback.
const oldLaunch = `Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(authUrl));\n                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);\n                getActivity().startActivity(intent);`;
const newLaunch = `Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(authUrl));\n                intent.setPackage("com.android.chrome");\n                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);\n                try {\n                    getActivity().startActivity(intent);\n                } catch (Exception chromeMissing) {\n                    Intent fallback = new Intent(Intent.ACTION_VIEW, Uri.parse(authUrl));\n                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);\n                    Intent chooser = Intent.createChooser(fallback, "Open authorization in browser");\n                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);\n                    getActivity().startActivity(chooser);\n                }`;
if (!pluginJava.includes(oldLaunch)) {
  throw new Error('Could not patch ChatGPTPlanPlugin.java: expected authorization launch block was not found.');
}
pluginJava = pluginJava.replace(oldLaunch, newLaunch);
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
