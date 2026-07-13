# PsychoPy Studio — HarmonyOS Port

[简体中文](./README-CN.md) | [Project Homepage](https://aik358.github.io/psychopy-studio-harmonyos/)

## Overview

**PsychoPy Studio** is an open-source experiment builder for psychology and neuroscience. This project ports it to **HarmonyOS** via the Electron-on-HarmonyOS runtime, packaging the PsychoPy Builder, Coder, and Runner as a native HarmonyOS Application Package (HAP).

> **Latest: v0.1.6** — switch to the `v0.1.6` branch. Configure automatic signing in DevEco Studio after download.

## What's New in v0.1.6 (2026-07-12)

### Python Backend — Activated

The Python integration layer is now **live** — no longer stubbed. All 30+ IPC handlers (liaison / venv / uv / shell / scripts / psychojs / harmony) are registered and functional.

| Milestone | Status |
|-----------|--------|
| System Python 3.12.8 detected (HNP path on Kirin X90a) | ✅ |
| `psychopy-lib` 2026.2.0 imports successfully (mock PyQt6/wx) | ✅ |
| `liaison_shim.py` — pure Python WebSocket JSON-RPC server | ✅ |
| PsychoPy ↔ Electron IPC over WebSocket `localhost:8004` | ✅ |
| `harmony.js` diagnostic engine (package detection, version check, pip/venv capability) | ✅ |
| Auto-install missing packages (`pip3 install --user`) | ✅ |
| Tiered fallback: system Python → venv → harmonybrew → manual | ✅ |
| Builder/Coder/Runner frontend with Python backend connected | ✅ |
| PsychoJS browser-based experiment execution (Chromium WebGL) | ⏳ pending HAP deploy |
| Native pyglet window creation (requires GPU/X11) | ❌ not available on HarmonyOS |

### Architecture (v0.1.6)

```
┌──────────────────────────────────────────────────┐
│                 HarmonyOS Device                   │
│  ┌──────────────────────────────────────────────┐ │
│  │            ArkUI (Ability)                    │ │
│  │  ┌────────────────────────────────────────┐  │ │
│  │  │       XComponent (Native)              │  │ │
│  │  │   ┌──────────────────────────────────┐ │  │ │
│  │  │   │  libelectron.so (Chromium 132)   │ │  │ │
│  │  │   │  ┌─────────────────────────────┐ │  │ │
│  │  │   │  │    Electron Main Process    │ │  │ │
│  │  │   │  │     index.cjs               │ │  │ │
│  │  │   │  │     Express :8003           │ │  │ │
│  │  │   │  │  ┌───────────────────────┐  │ │  │ │
│  │  │   │  │  │  Python Integration   │  │ │  │ │
│  │  │   │  │  │  harmony.js (detect)  │  │ │  │ │
│  │  │   │  │  │  venv.js (manage)     │  │ │  │ │
│  │  │   │  │  │  liaison.js (IPC)     │  │ │  │ │
│  │  │   │  │  │  psychojs.js (server) │  │ │  │ │
│  │  │   │  │  │  ───────────────────  │  │ │  │ │
│  │  │   │  │  │  liaison_shim.py      │  │ │  │ │
│  │  │   │  │  │  (WebSocket JSON-RPC) │  │ │  │ │
│  │  │   │  │  │  psychopy_worker.py   │  │ │  │ │
│  │  │   │  │  │  (code generation)    │  │ │  │ │
│  │  │   │  │  └───────────────────────┘  │ │  │ │
│  │  │   │  └─────────────────────────────┘ │  │ │
│  │  │   └──────────────────────────────────┘ │  │ │
│  │  └────────────────────────────────────────┘  │ │
│  │                                               │ │
│  │  System Python 3.12.8 (HNP)                   │ │
│  │  numpy / scipy / matplotlib / Pillow / pyglet │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Python Setup (Tiered)

The app auto-detects the Python environment and guides the user through installation:

1. **System Python** (HNP) — if Python 3.9+ exists with all packages → direct use, zero install
2. **Auto-install** — `pip3 install --user numpy scipy pillow pyglet websockets esprima psychopy-lib --no-deps`
3. **venv fallback** — if `--user` is denied: `python3 -m venv ~/.psychopy-venv` + install in isolation
4. **harmonybrew** — if no system Python: `brew install python@3.12`
5. **Manual** — HNP install or source compile guidance

### Liaison Communication

`liaison-py` (official) requires `rpds-py` → `maturin` → Rust compiler, which is unavailable on HarmonyOS. Solution: **`liaison_shim.py`** — a pure Python WebSocket JSON-RPC server (397 lines, zero compilation, depends only on `websockets` library). Verified working on HarmonyOS device.

## Version Timeline

| Version | Date | Key Achievement | Branch |
|---------|------|-----------------|--------|
| **v0.1.6** ⭐ | 2026-07-12 | Python backend activated, liaison_shim.py, tiered setup | `v0.1.6` |
| v0.1.5 | 2026-07-11 | PsychoJS browser experiment validation, PIXI.js fix | `v0.1.5` |
| v0.1.4 | 2026-06-25 | View switching rewrite, state persistence | `v0.1.4` |
| v0.1.3 | 2026-06-25 | ARM64 native self-build, SVG icons, Components panel | `v0.1.3_OHOS_arm64_dev_1` |
| v0.1.2 | 2026-06-24 | x86 cross-compile, landing page, i18n | `v0.1.2-HarmonyOS-Device-Dev-Test` |

## Build Instructions

### Prerequisites

- DevEco Studio 5.0+ (HarmonyOS SDK API 15+)
- Node.js 18.x+ (for frontend build)
- HarmonyOS device or emulator (ARM64 aarch64)

### Quick Build

```bash
# 1. Switch to v0.1.6 branch
git checkout v0.1.6

# 2. Install OHPM dependencies
ohpm install

# 3. Build frontend
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build
cd ../../../../../../../..

# 4. Build HAP (configure automatic signing in DevEco Studio first)
hvigorw --mode module -p module=web_engine@default,electron@default -p product=default -p buildMode=debug assembleHar assembleHap --no-daemon

# 5. Install on device
hdc app install electron/build/default/outputs/default/electron-default-signed.hap
```

### On-Device Frontend Build (HarmonyOS ARM64)

See [BUILD_ON_ARM64.md](./BUILD_ON_ARM64.md) for the full guide on building the frontend natively on HarmonyOS.

## Device Verification (Kirin X90a, 2026-07-12)

| Component | Status |
|-----------|--------|
| Python 3.12.8 (HNP) | ✅ `/data/service/hnp/python.org/python_3.12/` |
| numpy 2.2.1 / scipy 1.14.1 / matplotlib 3.10.0 | ✅ pre-installed |
| Pillow 11.0.0 / pyglet 1.5.27 | ✅ pre-installed |
| `pip3 install psychopy-lib --no-deps` | ✅ works (PyQt6/wx mocked) |
| `pip3 install websockets` | ✅ pure Python, zero compilation |
| `liaison_shim.py` WebSocket server | ✅ `localhost:8004` verified |
| psychopy-lib 2026.2.0 import | ✅ all modules load |
| Native pyglet window | ❌ no GPU/X11 libraries |
| liaison-py (rpds-py/maturin/Rust) | ❌ cannot compile |
| Electron-OH HAP deployed | ⏳ pending |

## Known Issues

- **Graphics**: Native pyglet window creation fails (no GPU/X11). Experiment execution uses PsychoJS browser route (Chromium WebGL).
- **ArkTS warnings**: `arkts-no-classes-as-obj` warnings — non-blocking.
- **Deprecated APIs**: Multiple (`show`, `getContext`, `getFontByName`, etc.) — need SDK 26 migration.

## Project Structure

```
AppScope/                         # HarmonyOS app configuration
electron/                         # Electron module (entry HAP)
├── src/main/ets/                 # ArkTS entry abilities
├── src/main/resources/           # String resources
├── libs/arm64-v8a/               # Native .so libraries (160MB libelectron.so)
web_engine/                       # Web engine module (HAR)
├── src/main/ets/                 # Web ability, adapters, bindings
├── src/main/resources/
│   └── resfile/resources/app/    # SvelteKit frontend source
│       ├── src/                  # Svelte source code
│       ├── dist/                 # Compiled frontend (vite build output)
│       └── electron/src/         # Main process
│           ├── index.cjs         # Electron entry (Python import + IPC)
│           ├── preload.js        # Electron preload bridge
│           └── python/           # Python integration layer
│               ├── harmony.js    # HarmonyOS detection & diagnostics
│               ├── venv.js       # Python environment management
│               ├── liaison.js    # WebSocket IPC to Python
│               ├── uv.js         # UV package manager
│               ├── psychojs.js   # PsychoJS experiment server
│               ├── shell.js      # Python interactive shell
│               ├── script.js     # Script execution
│               ├── utils.js      # Output / process management
│               ├── index.js      # Handler registration (30+ IPC channels)
│               ├── liaison_shim.py    # Pure Python WebSocket JSON-RPC
│               └── psychopy_worker.py # PsychoJS code generator
chromium/                         # Chromium module
build-profile.json5               # Hvigor build config
```

## Branches

| Branch | Description |
|--------|-------------|
| `v0.1.6` | **Latest** — Python backend activated, liaison_shim.py, tiered setup |
| `v0.1.5` | PsychoJS browser experiment validation |
| `v0.1.4` | View switching rewrite + state persistence |
| `v0.1.3_OHOS_arm64_dev_1` | ARM64 native build (verified on device) |
| `v0.1.2-HarmonyOS-Device-Dev-Test` | ARM64 native build experiments |
| `test-shim` | Active development branch |
| `main` | Landing page + documentation |

## License

- Project template: Apache 2.0
- PsychoPy: [GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

---

> **Last updated: 2026-07-12 | v0.1.6**
> Project homepage: [https://aik358.github.io/psychopy-studio-harmonyos/](https://aik358.github.io/psychopy-studio-harmonyos/)
> GitCode: [https://gitcode.com/A9iska/psychopy-oh](https://gitcode.com/A9iska/psychopy-oh)
