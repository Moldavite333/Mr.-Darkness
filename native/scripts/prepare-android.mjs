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

// Some Android devices/networks can resolve OpenAI in Chrome while native Java/OkHttp DNS fails.
// Use DNS-over-HTTPS with fixed bootstrap resolver IPs for native token/model/response calls,
// then fall back to Android's system resolver if DoH itself fails.
const importAnchor = 'import okhttp3.FormBody;';
if (!pluginJava.includes(importAnchor)) {
  throw new Error('Could not patch ChatGPTPlanPlugin.java: OkHttp import anchor was not found.');
}
pluginJava = pluginJava.replace(importAnchor, `import okhttp3.Dns;\nimport okhttp3.FormBody;\nimport okhttp3.dnsoverhttps.DnsOverHttps;`);
pluginJava = pluginJava.replace('import java.net.URI;', 'import java.net.InetAddress;\nimport java.net.URI;\nimport java.net.UnknownHostException;');

const oldHttpClient = '    private final OkHttpClient http = new OkHttpClient.Builder().retryOnConnectionFailure(true).build();';
const newHttpClient = `    private static OkHttpClient buildHttpClient() {\n        try {\n            OkHttpClient bootstrap = new OkHttpClient.Builder().retryOnConnectionFailure(true).build();\n            DnsOverHttps doh = new DnsOverHttps.Builder()\n                .client(bootstrap)\n                .url(HttpUrl.get("https://dns.google/dns-query"))\n                .bootstrapDnsHosts(\n                    InetAddress.getByAddress(new byte[]{8, 8, 8, 8}),\n                    InetAddress.getByAddress(new byte[]{8, 8, 4, 4})\n                )\n                .build();\n            Dns resilientDns = hostname -> {\n                try {\n                    return doh.lookup(hostname);\n                } catch (UnknownHostException dohFailure) {\n                    return Dns.SYSTEM.lookup(hostname);\n                }\n            };\n            return new OkHttpClient.Builder()\n                .dns(resilientDns)\n                .retryOnConnectionFailure(true)\n                .build();\n        } catch (Exception setupFailure) {\n            return new OkHttpClient.Builder().retryOnConnectionFailure(true).build();\n        }\n    }\n\n    private final OkHttpClient http = buildHttpClient();`;
if (!pluginJava.includes(oldHttpClient)) {
  throw new Error('Could not patch ChatGPTPlanPlugin.java: expected OkHttp client line was not found.');
}
pluginJava = pluginJava.replace(oldHttpClient, newHttpClient);
await writeFile(generatedPlugin, pluginJava, 'utf8');

const gradlePath = resolve(androidRoot, 'app/build.gradle');
let gradle = await readFile(gradlePath, 'utf8');
const marker = '// MR_DARKNESS_CHATGPT_PLAN_DEPENDENCIES';
if (!gradle.includes(marker)) {
  gradle = gradle.replace(/dependencies\s*\{/, match => `${match}\n    ${marker}\n    implementation "androidx.security:security-crypto:1.1.0"\n    implementation "com.squareup.okhttp3:okhttp:4.12.0"\n    implementation "com.squareup.okhttp3:okhttp-dnsoverhttps:4.12.0"\n    implementation "com.nimbusds:nimbus-jose-jwt:10.10"`);
  await writeFile(gradlePath, gradle, 'utf8');
} else if (!gradle.includes('okhttp-dnsoverhttps')) {
  gradle = gradle.replace('implementation "com.squareup.okhttp3:okhttp:4.12.0"', 'implementation "com.squareup.okhttp3:okhttp:4.12.0"\n    implementation "com.squareup.okhttp3:okhttp-dnsoverhttps:4.12.0"');
  await writeFile(gradlePath, gradle, 'utf8');
}

run('npx', ['cap', 'sync', 'android']);

// The native ChatGPT bridge performs its own HTTPS requests after the browser callback.
// Make the permission explicit so token exchange, model discovery and Responses requests can resolve/connect.
const manifestPath = resolve(androidRoot, 'app/src/main/AndroidManifest.xml');
let manifest = await readFile(manifestPath, 'utf8');
const internetPermission = '<uses-permission android:name="android.permission.INTERNET" />';
if (!manifest.includes('android.permission.INTERNET')) {
  manifest = manifest.replace(/<manifest\b[^>]*>/, match => `${match}\n    ${internetPermission}`);
  await writeFile(manifestPath, manifest, 'utf8');
}
if (!manifest.includes('android.permission.INTERNET')) {
  throw new Error('Android INTERNET permission could not be added to the generated manifest.');
}

console.log('Mr Darkness Android shell prepared with verified local ChatGPT plan-sharing bridge, network permission, and DoH DNS fallback.');
