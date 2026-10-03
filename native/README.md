# Mr Darkness V3 — Android shell

This directory packages the V3 producer workstation as a real Android app using Capacitor.

## Architecture

- `../v3/` — local-first HTML/CSS/JS producer workstation.
- `scripts/sync-web.mjs` — copies V3 into `native/www` before a native build.
- `scripts/prepare-android.mjs` — creates/syncs the Capacitor Android project and installs the custom native bridge.
- `android-plugin/ChatGPTPlanPlugin.java` — native `ChatGPTPlan` Capacitor plugin.
- `android-plugin/LoopbackCallbackServer.java` — loopback OAuth receiver bound to `127.0.0.1` on a random local port.
- `android-plugin/MainActivity.java` — registers the plugin with Capacitor.

## ChatGPT plan sharing

The native bridge is designed for OpenAI's open-source **Sign in with ChatGPT** / plan-sharing flow. It uses:

- OAuth Authorization Code + PKCE
- stable local host UUID
- state + nonce validation
- exact `127.0.0.1` loopback callback
- OpenAI JWKS validation for the ID token
- encrypted Android credential storage
- rotating refresh-token handling
- account model discovery via `/v1/models`
- streamed Responses API calls with `store: false` and `stream: true`

No OpenAI API key is embedded in the Android app, JavaScript bundle, GitHub repository, or browser localStorage.

## Browser fallback

The GitHub Pages V3 preview cannot safely retain ChatGPT OAuth credentials. In the browser, the Brain drawer instead builds and copies the complete active-song/project context and opens ChatGPT. When the same frontend runs inside the Android shell, it detects the native bridge and answers inside the app.

## Build

GitHub Actions builds a debug APK automatically when `v3/` or `native/` changes. The workflow artifact is named:

`mr-darkness-v3-debug-apk`

For a local Android Studio build:

```bash
cd native
npm install
npm run prepare-android
npx cap open android
```

## Security notes

- OAuth credentials are stored with Android encrypted preferences.
- Access/refresh tokens are never exposed to the V3 browser JavaScript.
- The authorization callback listens only on loopback (`127.0.0.1`).
- Project/song data remains local-first unless explicitly sent as model context.
