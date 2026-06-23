# PsychoPy Studio - HarmonyOS Port v0.1.1

[简体中文](./README-CN.md)

## Overview

**PsychoPy Studio** is an open-source experiment builder for psychology and neuroscience. This project ports it to **HarmonyOS (OpenHarmony)** via the Electron-on-HarmonyOS runtime, packaging the PsychoPy Builder, Coder, and Runner as a native HarmonyOS Application Package (HAP) that runs on tablets and 2-in-1 devices.

Future releases will integrate the **Python backend (CPython/UV)** directly into the HAP, enabling users to edit, compile, and **run experiments entirely on their HarmonyOS devices** without external dependencies.

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
