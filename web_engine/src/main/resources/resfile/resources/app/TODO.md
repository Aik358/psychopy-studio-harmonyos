## Completed

| # | Task | Status |
|---|------|:------:|
| 1 | **Bundle `libsndfile.so` into HAP** — ARM64 .so from Debian aarch64, placed in `libs/arm64-v8a/`, fallback removed | ✅ |
| 2 | **Upgrade Electron OH to v34.8.4** — libelectron 159MB, libadapter 5.2MB, all ETS adapters synced | ✅ |
| 3 | **AppGallery publishing prep** — package rename `com.a9iska.psychopy`, zh_CN locale, multi-size icons, privacy policy, attribution | ✅ |
| 4 | **Release signing config** — .p12/.cer/.p7b generated via AGC, `build-profile.json5` configured | ✅ |
| 5 | **Privacy-sensitive log cleanup** — removed deviceId/URI/file-path logs from ETS adapters | ✅ |
| 6 | **Chinese localization (i18n)** — Svelte 5 runes store, SSR-safe, menu/ribbon/dialog translation | ✅ |
| 7 | **Language switcher + zoom slider** — top-nav bar: Builder/Coder/Runner + LangSwitch + ZoomSlider | ✅ |
| 8 | **Tablet mode detection** — preload.js IPC bridge + harmony-python.js handler + functions.svelte.js fallback | ✅ |
| 9 | **Tablet mode UI** — bottom-right pill banner, gracefully handles no-Python scenario | ✅ |
| 10 | **View switching bug fix** — removed `electron.windows.navigate()` full-reload fallback | ✅ |

## In Progress

| # | Task | Priority | Status |
|---|------|:---:|------|
| 11 | **ACL permission ALLOW_WRITABLE_CODE_MEMORY** | High | ⏳ AGC review |
| 12 | **Tablet mode crash fix verification** — new framework + ACL permission | High | ⏳ pending |

## Remaining

| # | Task | Priority | Notes |
|---|------|:---:|------|
| 13 | **Add Pavlovia OAuth routes** | Medium | `index.cjs` |
| 14 | **Replace manual HTTP server with Express** | Low | `index.cjs` |
| 15 | **Splash screen from official 2026.1.2** | Low | `index.cjs` |
| 16 | **Fix theme CSS loading on HarmonyOS WebView** | Medium | `/themes/*.css` `<link>` may fail; fallback vars in place |
| 17 | **Runner `.js` file support** | Low | `runner/callbacks.svelte.js` |
