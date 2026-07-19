## Future TODO

| # | Task | Priority | Files |
|---|------|:---:|------|
| 1 | **Bundle `libsndfile.so` into HAP** — get ARM64 .so from harmonybrew, place in `electron/libs/arm64-v8a/`, remove `liaison_shim.py` fallback | High | `liaison_shim.py` |
| 2 | **Add Pavlovia OAuth routes** — `/api/token/authorize`, `/api/token/refresh`, `/api/report` | Medium | `index.cjs` |
| 3 | **Fix Builder/Coder/Runner view switching** — occasional deadlock/hang when switching views | Medium | `views.svelte.js`, `sharedViewStore.svelte.js`, route pages |
| 4 | **Add Chinese localization** — required for HarmonyOS AppGallery review | Medium | `src/lib/`, i18n config |
| 5 | **Replace manual HTTP server with Express** — restore official Express middleware | Low | `index.cjs` |
| 6 | **Splash screen** — copy `splash.html` + `splash.svg` from official 2026.1.2 | Low | `index.cjs` |
| 7 | **Fix duplicate liaison process logging** — root-cause the double `LIAISON_START` / command execution | Low | `harmony-python.js` |
| 8 | **Dynamic Python path discovery** — extend `findPython`-style scanning to `HARMONY_SITE_PACKAGES` and `liaison_shim.py` sys.path injection | Low | `harmony-python.js`, `liaison_shim.py` |
| 9 | **Runner `.js` file support** — add `.js` branch to `addFile()`, add `runJS()` to `Script` class | Low | `runner/callbacks.svelte.js` |
| 10 | **AppGallery publishing** — configure signing, icons, privacy policy, review materials | Future | — |
