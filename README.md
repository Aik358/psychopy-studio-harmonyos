# PsychoPy Studio - HarmonyOS ARM64 Port v0.1.2

[简体中文](./README-CN.md)

## Overview

**PsychoPy Studio** is an open-source experiment builder for psychology and neuroscience. This project ports it to **HarmonyOS (OpenHarmony)** via the Electron-on-HarmonyOS runtime, packaging the PsychoPy Builder, Coder, and Runner as a native HarmonyOS Application Package (HAP).

**Key achievement**: First successful build and run of PsychoPy Studio on **HarmonyOS ARM64 (aarch64)** native device, including frontend `dist/` compilation entirely on-device using harmonybrew toolchain.

## v0.1.2 Features

- **Full ARM64 native build** — Frontend `vite build` runs on HarmonyOS device itself
- **PsychoPy Builder** — Graphical experiment editor with drag & drop components
- **PsychoPy Coder** — Python/JS code editor
- **PsychoPy Runner** — Experiment execution interface (requires Python backend)
- **View switching** — In-app navigation between Builder/Coder/Runner tabs
- **Native window title bar** — Min/max/close buttons via HarmonyOS native frame
- **SVG Icons** — Fixed CSS variable inheritance via inline SVG rendering
- **Components panel** — Local fallback profiles, no Python dependency
- **Electron Express server** — Serves SvelteKit frontend on localhost:8003

## Build Instructions

### Prerequisites

- DevEco Studio 5.0+ (HarmonyOS SDK API 15+)
- HarmonyOS device or emulator (ARM64 aarch64)
- harmonybrew (Node.js v26.3.1, binary-sign-tool)

### Quick Build

```bash
# 1. Install OHPM dependencies
ohpm install

# 2. Build frontend on standard PC (or see BUILD_ON_ARM64.md for on-device build)
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build
cd ../../../../../../../..

# 3. Build HAP
hvigorw --mode module -p module=web_engine@default,electron@default -p product=default -p buildMode=debug assembleHar assembleHap --no-daemon
```

### On-Device Frontend Build (HarmonyOS ARM64)

See [BUILD_ON_ARM64.md](./BUILD_ON_ARM64.md) for the full guide on building the frontend natively on HarmonyOS, including native binding signing and WASM fallbacks.

## Architecture

```
┌─────────────────────────────────────────┐
│            HarmonyOS Device              │
│  ┌───────────────────────────────────┐  │
│  │         ArkUI (Ability)           │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   XComponent (Native)       │  │  │
│  │  │   ┌──────────────────────┐  │  │  │
│  │  │   │ libelectron.so       │  │  │  │
│  │  │   │  ┌────────────────┐  │  │  │  │
│  │  │   │  │ Electron Main  │  │  │  │  │
│  │  │   │  │  - index.cjs   │  │  │  │  │
│  │  │   │  │  - Express srv │  │  │  │  │
│  │  │   │  │  - Python stub │  │  │  │  │
│  │  │   │  └────────────────┘  │  │  │  │
│  │  │   └──────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Known Issues

- **Python backend**: Experiment execution requires Python/UV runtime not yet ported. Currently stubbed with IPC fallbacks.
- **ArkTS warnings**: `arkts-no-classes-as-obj` warnings across adapter bindings — non-blocking.
- **Deprecated API warnings**: Multiple (`show`, `getContext`, `getFontByName`, etc.) — need migration for SDK 26 compliance.

## Development Workflow

1. Edit Svelte source files (`web_engine/.../resources/app/src/`)
2. Run `npx vite build` (on standard PC or see BUILD_ON_ARM64.md for on-device)
3. Run `hvigorw --mode module -p module=web_engine@default assembleHar`
4. Run `hvigorw --mode module -p module=electron@default assembleHap`

## Project Structure

```
AppScope/                         # HarmonyOS app configuration
├── app.json5                     # App name, icon, bundle info
├── resources/base/media/         # App icon assets
electron/                         # Electron module (entry HAP)
├── src/main/ets/                 # ArkTS entry abilities
├── src/main/resources/           # String resources
├── libs/arm64-v8a/               # Native .so libraries (160MB libelectron.so)
web_engine/                       # Web engine module (HAR)
├── src/main/ets/                 # Web ability, adapters, bindings
├── src/main/resources/           # Frontend resources
│   └── resfile/resources/app/    # SvelteKit frontend source
│       ├── src/                  # Svelte source code
│       ├── dist/                 # Compiled frontend (vite build output)
│       └── electron/src/         # Main process (index.cjs)
│           ├── python/           # Python backend stubs
│           └── preload.js        # Electron preload bridge
chromium/                         # Chromium module
build-profile.json5               # Hvigor build config
```

## Branches

| Branch | Description |
|--------|-------------|
| `v0.1.2` | Latest features with frontend fixes |
| `v0.1.2-HarmonyOS-Device-Dev-Test` | ARM64 native build experiments |
| `v0.1.1` | Previous stable version |

## License

- Project template: Apache 2.0
- PsychoPy: [GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

---

> **Last updated: 2026-06-25**
> For the complete HarmonyOS ARM64 build guide including troubleshooting, native binding signing, and WASM fallbacks, see [BUILD_ON_ARM64.md](./BUILD_ON_ARM64.md).
> For the v0.1.1 debug log, see [README-v011.md](./README-v011.md).

---

## 🚀 v0.1.3_OHOS_arm64_dev_1 (2026-06-25)

### Summary
First successful self-hosted build of PsychoPy Studio entirely on a **HarmonyOS ARM64 (aarch64)** device. The frontend `dist/` was compiled on-device using harmonybrew toolchain, with native binding signing via `binary-sign-tool`.

### Key Achievements
| Milestone | Status |
|-----------|--------|
| Frontend `vite build` on HarmonyOS ARM64 | ✅ **DONE** — 10.5s, 668 modules |
| Native addon code signing (`binary-sign-tool`) | ✅ **DONE** — rolldown, lightningcss |
| WASM fallback for missing libs | ✅ **DONE** — lightningcss-wasm |
| SVG icons rendered (inline SVG fallback) | ✅ **DONE** — fetch + {@html} |
| Components panel (local fallback profiles) | ✅ **DONE** — Promise.resolve |
| Native window title bar (min/max/close) | ✅ **DONE** — hideTitleBar=false |
| App icon and name (PsychoPy Studio) | ✅ **DONE** |
| Application opened on device | ✅ **DONE** |
| Builder editing, save, reopen | ✅ **DONE** |
| Builder → Coder / Runner code sync | ❌ **BROKEN** — IPC timing, window management |
| Coder file open from URL parameter | ❌ **BROKEN** — onMount not triggering |

### Build Environment
| Tool | Version | Path |
|------|---------|------|
| Node.js | 26.3.1 | `/storage/Users/currentUser/.harmonybrew/Cellar/node/26.3.1/bin/node` |
| npm CLI | 11.16.0 | (via `node npm-cli.js`) |
| binary-sign-tool | — | `/storage/Users/currentUser/.harmonybrew/bin/binary-sign-tool` |
| hvigor | 1.0.0 | `/data/app/hvigor.org/hvigor_1.0.0/bin/hvigorw.js` |
| OS | HarmonyOS | HongMeng Kernel 1.12.0, aarch64 |

### Known Issues (v0.1.3)

1. **Builder → Coder / Runner code sync**: `openIn()` and `showWindow()` in `views.svelte.js` don't properly manage Electron BrowserWindows. IPC `fileOpen` messages may arrive before the target window's listener is registered. URL parameter fallback (`?fileOpen=`) also fails to trigger `onMount`. 
   - **Workaround**: Manually open files via the Coder's File Explorer panel.

2. **View switching loses state**: `showWindow()` previously had a `window.location.href` redirect that destroyed the current view's state. Now removed, but window management still not working in HarmonyOS Electron.

3. **Runner view**: Not tested — requires `.psyrun` file to execute experiments.

4. **Python backend**: All Python-dependent features are stubbed with placeholder responses. `writeScript()` falls back to saving experiment XML as a `.py` file.

5. **Monaco Editor**: Configured to load from local path (`/monaco/vs`) instead of CDN, but still has loading issues in some scenarios.

### Debug Log (2026-06-25)

#### 09:00 — Node.js __errno_location crash
- System Node.js (v24.13.0) crashes with `Check failed: 12 == (*__errno_location())`
- Fixed by using harmonybrew Node.js v26.3.1 (`--dest-os=openharmony --partly-static`)

#### 09:30 — npm EBADPLATFORM
- npm rejects openharmony platform due to `"os"` field in `package.json`
- Fixed by deleting `"os"` field

#### 10:00 — dlopen Permission denied
- Native `.node` addons blocked by HarmonyOS security policy
- Fixed by signing with `binary-sign-tool sign -selfSign 1`

#### 10:30 — lightningcss libgcc_s.so.1 missing
- Linux ARM64 binding needs `libgcc_s.so.1` which doesn't exist on HarmonyOS
- Fixed by replacing with `lightningcss-wasm` (WASM fallback)

#### 11:00 — Vite build with --permission flags
- Node.js permission model blocks file/worker/child-process access
- Fixed with:
  ```
  --permission --allow-addons --allow-fs-read=* --allow-fs-write=*
  --allow-child-process --allow-worker
  ```

#### 11:30 — SVG icons not showing
- `<use href={url}>` doesn't inherit CSS variables from page context
- Fixed by `fetch()` + inline `{@html svgContent}` in `Icon.svelte`

#### 12:00 — Components panel stuck "Loading..."
- `pending.components` initialized with never-resolving Promise
- `python.liaison.send` threw error instead of rejecting gracefully
- Fixed by `Promise.resolve()` + `liaison.send` returning placeholder

#### 13:00 — ESM require() in CJS
- `index.cjs` used `require()` for ES modules (`.js` files with `"type":"module"`)
- Fixed by async IIFE with `await import()`

#### 14:00 — App icon and name
- AppScope `string.json` had "Electron" as app name
- Fixed by changing to "PsychoPy Studio" and updating icons

#### 14:30 — Window title bar
- `hideTitleBar: true` in `WebBaseAbility.ets` hid native window controls
- Fixed by changing to `hideTitleBar: false`

#### 15:00 — View switching between Builder/Coder/Runner
- Custom SPA navigation tabs conflicted with original Electron IPC architecture
- Reverted to original `showWindow()`/`openIn()` multi-window approach
- Window management still not working — IPC timing issue

#### 16:00 — Coder/Runner code display
- `writeScript()` failed due to Python backend absence
- Added fallback: save experiment XML as `.py` file
- `onMount()` with `?fileOpen=` URL parameter doesn't trigger
- Monaco Editor CDN → local path configured

### Next Steps
- [ ] Fix Builder → Coder IPC sync (send fileOpen after window ready)
- [ ] Fix Coder onMount with ?fileOpen parameter (or use $effect)
- [ ] Test Runner view
- [ ] Integrate Python backend (CPython/UV for HarmonyOS)
- [ ] Port to main branch landing page
