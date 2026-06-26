# PsychoPy Studio - HarmonyOS Port

[简体中文](./README-CN.md) | [Project Homepage](https://aik358.github.io/psychopy-studio-harmonyos/)

## Overview

**PsychoPy Studio** is an open-source experiment builder for psychology and neuroscience. This project ports it to **HarmonyOS (OpenHarmony)** via the Electron-on-HarmonyOS runtime, packaging the PsychoPy Builder, Coder, and Runner as a native HarmonyOS Application Package (HAP).

> **Latest version: v0.1.4** — switch to the `v0.1.4` branch. Download and configure automatic signing in DevEco Studio.

## Version Timeline

| Version | Date | Platform | Status |
|---------|------|----------|--------|
| **v0.1.4** ⭐ | 2026-06-25 | x86 / ARM64 | **Latest** — View switching rewrite, shared store state persistence, Builder→Coder code sync. [Details](https://gitcode.com/A9iska/psychopy-oh/tree/v0.1.4) |
| **v0.1.3** | 2026-06-25 | HarmonyOS ARM64 | Self-built on-device, SVG icons fixed, Components panel working, native title bar. |
| **v0.1.2** | 2026-06-24 | x86 (cross-compile) | HAP built on x86, same feature level as v0.1.3. Python backend not integrated. |

## v0.1.0 Features

- **PsychoPy Builder**: Graphical experiment editor (drag & drop components, flow timeline)
- **PsychoPy Coder**: Python/JS code editor for experiment scripts
- **PsychoPy Runner**: Experiment execution interface (requires Python backend)
- **View switching**: Menu → View → Show Coder/Runner (current window navigation)
- **SVG Icons**: All toolbar and component icons rendering correctly
- **Splash startup animation**: Built-in startup page with loading state → auto-navigate to builder
- **Electron Express server**: Serves SvelteKit frontend on localhost:8003
- **Multi-window support**: BrowserWindow API enabled (focus management WIP on HarmonyOS)

## Build Instructions

### Prerequisites
- DevEco Studio 5.0+ (HarmonyOS SDK API 15)
- Node.js 18.x+
- HarmonyOS device or emulator (tablet / 2in1)

### Build Commands

```bash
# 1. Install OHPM dependencies
ohpm install

# 2. Install npm deps and build frontend
cd web_engine/src/main/resources/resfile/resources/app
npm install
npm install --save-dev @sveltejs/kit @sveltejs/adapter-static vite
npx vite build
cd ../../../../../../../..

# 3. Build HAP (or use DevEco Studio: Build → Build Hap(s))
hvigorw --mode module -p module=electron@default assembleHap -p buildMode=debug

# 4. Install on device
hdc app install electron/build/default/outputs/default/electron-default-signed.hap
```

### First-time Signing Setup
1. Open project in DevEco Studio
2. File → Project Structure → Signing Configs
3. Check "Automatically generate signature"
4. Build

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
│  │  │   │  └────────────────┘  │  │  │  │
│  │  │   └──────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Known Issues

- **Python backend**: Experiment execution requires Python/UV runtime not yet ported to HarmonyOS
- **Multi-window focus**: New BrowserWindows created but focus management WIP
- **Native window controls**: HarmonyOS Electron frame implementation varies by version

## Roadmap

### Short-term
- [ ] Python backend port (CPython/UV for HarmonyOS)
- [ ] Multi-window focus fix
- [ ] File system integration (.psyexp file picker)

### Medium-term
- [ ] Pavlovia sync (Git-based experiment sharing)
- [ ] Plugin system
- [ ] Peripheral support (monitor calibration, button box)

### Long-term
- [ ] Pure ArkUI implementation
- [ ] HarmonyOS AppGallery distribution

## Application Data

| Directory | Path |
|-----------|------|
| User data | `/data/storage/el2/base/files` |
| App install | `/data/storage/el1/bundle` |
| Preferences | `{userData}/psychopy4/preferences.json` |

## License

- Project template: Apache 2.0
- PsychoPy: [GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

---

> **Last updated: 2026-06-23 15:57 CST**  
> This document records a full-day debugging session on HarmonyOS native development.

## 🧪 2026-06-23 Debug Log

### Symptom
App starts (Builder UI visible, buttons clickable) but **all SVG icons are blank**.

### Root Cause
1. **CSS variables don't cascade into external SVGs** — SVGs use `fill:var(--outline)`, `stroke:var(--text)`. When loaded via `<img>` or `<use>`, these vars are undefined.
2. **`npx vite build` unavailable** — HarmonyOS built-in Node.js 22.7.0 < Vite 6.x requirement (22.12+). Even after Homebrew upgrade to 26.3.1, `@rolldown/binding-openharmony-arm64` native module blocked by system (`Permission denied`).
3. **npm unstable** on HarmonyOS — crashes with native stack trace on `npm install`.

### Fixes Attempted (all failed due to CSS var issue or inability to rebuild)
- Icon.svelte: `<use>` → `fetch()`+inline → `<img>` → all need `npx vite build`
- Express: URL rewrite, CORS headers, explicit routes, `<use>`→`<img>` injection
- Patched compiled dist chunk (`Bz6sfiOo.js`) 
- Hardcoded SVG colors → reverted (Electron crash)
- `targetSdkVersion` format fixes (00306042 error)

### Recommendations

**Build frontend on a standard PC (Linux/macOS/Windows):**
```bash
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build
# copy dist/ back to HarmonyOS device, then:
hvigorw --mode module -p module=electron@default -p product=default -p buildMode=debug assembleHap --no-daemon
```

Or use the pre-built `dist/` from this repo (committed to git).

Or wait for DevEco Studio/Node.js update on HarmonyOS.

---

## Critical Notes for Developers (v0.1.2+)

### NPM Build is Mandatory — Never Copy `dist/` Directly

The `web_engine/src/main/resources/resfile/resources/app/dist/` directory contains the **compiled SvelteKit frontend** (PsychoPy Builder/Coder/Runner UI). This directory is **NOT tracked in git** and must be generated locally via:

```bash
cd web_engine/src/main/resources/resfile/resources/app/
npm install        # install @sveltejs/kit, vite, adapter-static, etc.
npx vite build     # generates ./dist/ (output: .svelte-kit/output/client/ + ./dist/)
```

**Why this matters (debugging history):**

- Attempting to `Copy-Item` or manually copy `dist/` from another project or git branch **causes icon rendering failures** (SVG icons show as blank/missing).
- The `dist/` contains compiled JavaScript chunks with embedded asset paths, icon references (`/icons/btn-*.svg`, `/icons/sym-*.svg`), and Svelte component bindings that are **specific to the exact source code version**.
- Icon loading relies on SvelteKit's compiled chunk system; stale chunks from a different build produce broken `<img>` or `<svg><use>` references.
- The symptom: app launches, all UI works, but **no toolbar/component icons display** — only empty placeholder areas.
- Fix: always run `npx vite build` from the `resources/app/` directory, **not from the project root**, and **never reuse another project's `dist/`**.

### Build Pipeline Summary

```
Source files (src/ + static/) 
    → npx vite build 
        → dist/ (compiled frontend)
            → hvigorw assembleHar (web_engine HAR)
                → hvigorw assembleHap (electron HAP)
                    → signed HAP → device
```

### Frontend Development Workflow

1. Edit Svelte source files in `web_engine/src/main/resources/resfile/resources/app/src/`
2. Run `npx vite build` in that directory
3. Run `hvigorw --mode module -p module=web_engine@default assembleHar`
4. Run `hvigorw --mode module -p module=electron@default assembleHap`
5. Install via `hdc install .../electron-default-signed.hap`

### Known Caveats

- Node.js environment is required on the build host (DevEco Studio's bundled Node.js works: `D:\DevEco Studio\tools\node\node.exe`)
- `node_modules/` should NOT be committed to git (use `.gitignore`)
- `npx vite build` must be run from the correct working directory (`resources/app/`)
- The `package.json` intentionally omits a `"scripts"` section — use `npx vite build` directly
- Vite build output goes to both `.svelte-kit/output/` and `dist/` — only `dist/` is packaged into the HAP

---

## 🚀 v0.1.2-HarmonyOS-Device-Dev-Test (2026-06-24)

### Branch
[`v0.1.2-HarmonyOS-Device-Dev-Test`](https://gitcode.com/A9iska/psychopy-oh/tree/v0.1.2-HarmonyOS-Device-Dev-Test)

### Summary
This branch represents the first on-device debugging session directly on a HarmonyOS device (HongMeng Kernel 1.12.0, aarch64). Built entirely on-device using the harmonybrew toolchain.

### Changes from v0.1.1

| Area | Description |
|------|-------------|
| **Landing page** | Complete rewrite of `index.html` — 4 interactive demo panels: Gabor Patch, Masked Priming, EEG Triggers, Eye Tracking. Bilingual (EN/ZH) i18n. |
| **Project structure** | Flattened directory layout. Removed nested `ohos_electron_hap-main/`. All modules (`electron/`, `web_engine/`, `chromium/`, `AppScope/`) at project root. |
| **Build config** | `compatibleSdkVersion`: `6.1.0(23)`, `compileSdkVersion`: `6.1.0(23)`, `targetSdkVersion`: `6.1.0(23)`. Signing config cleaned of machine-specific credentials. |
| **SDK** | HarmonyOS SDK 26.0.0.18 Beta (API 26) installed via harmonybrew. |
| **App name** | Changed from `Electron` to `PsychoPy Studio`. |

### Build Status

| Step | Status |
|------|--------|
| `hvigorw assembleHap` | ✅ **BUILD SUCCESSFUL** (18s, 82ms) |
| HAP size | 214MB (`electron-default-signed.hap`) |
| Resource conflicts | ⚠️ `button_cancel`, `button_ok`, `button_background`, `button_font`, `checkbox_selected`, `start_window_background` — duplicated between `electron/` and `web_engine/` modules. Need deduplication. |
| ArkTS warnings | ⚠️ 50+ `arkts-no-classes-as-obj` warnings across `web_engine/` adapter bindings. Non-blocking but should be addressed for API 26 compliance. |
| Deprecated API warnings | ⚠️ Multiple (`show`, `getContext`, `getFontByName`, `Locale`, `vp2px`, `back`, `getParams`, `showToast`, `pushUrl`, `getShared`, `decodeWithStream`, `setLocalName`, `getSystemLocale`). Need migration to v26 equivalents. |
| DevEco Studio Run | ❌ Run button grayed out — project sync issues persist. Workaround: build via CLI `hvigorw` and install manually. |

### Known Issues on This Branch

1. **DevEco Studio Run button grayed out** — Project sync fails intermittently. Recommendation: clean re-clone from upstream and reapply config.
2. **Resource conflicts** — `electron/` and `web_engine/` modules both declare identical string/color resources (`button_cancel`, `button_ok`, etc.). The first declaration takes effect but the conflict should be resolved by removing duplicates from `web_engine/`.
3. **`dist/` directory empty** — The `web_engine/` prebuilt frontend `dist/` is not present in this checkout. Requires `npm install && npx vite build` on a standard PC to restore icon rendering.
4. **No `oh_modules/`** — OHPM dependencies not restored after cache cleanup. Run `ohpm install` before building.
5. **Python backend not included** — No Python/CPython runtime is bundled. Experiment execution requires external setup.

### Quick Start (from scratch)

```bash
# 1. Clone the branch
git clone -b v0.1.2-HarmonyOS-Device-Dev-Test https://gitcode.com/A9iska/psychopy-oh.git
cd psychopy-oh

# 2. Install OHPM dependencies
ohpm install

# 3. Build frontend on a standard PC (see instructions above)
#    or copy a pre-built dist/ from a working build

# 4. Build HAP
hvigorw --mode module -p module=electron@default -p product=default -p buildMode=debug assembleHap --no-daemon

# 5. Install on device
hdc install electron/build/default/outputs/default/electron-default-signed.hap
```

### Next Steps

- [ ] Re-clone from upstream and reapply device-specific config
- [ ] Deduplicate resources between `electron/` and `web_engine/` modules
- [ ] Migrate deprecated ArkTS APIs to HarmonyOS SDK 26 equivalents
- [ ] Build frontend `dist/` on a standard PC
- [ ] Resolve DevEco Studio sync for Run button
- [ ] Integrate Python backend (CPython/UV for HarmonyOS)
