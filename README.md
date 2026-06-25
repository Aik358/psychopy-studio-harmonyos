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
