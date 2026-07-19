# PsychoPy Studio — HarmonyOS Port

[简体中文](./README-CN.md) | [Project Homepage](https://aik358.github.io/psychopy-studio-harmonyos/)

## Overview

**PsychoPy Studio** is an open-source experiment builder for psychology and neuroscience. This project ports it to **HarmonyOS** via the Electron-on-HarmonyOS runtime, packaging the PsychoPy Builder, Coder, and Runner as a native HarmonyOS Application Package (HAP).

> **Latest: v2026.1.2** — switch to the `2026.1.2` branch.

## What's New in 2026.1.2 (2026-07-20)

### Core: Fully Working Experiment Pipeline

The entire Builder → Compile → Run-in-Browser pipeline is now **end-to-end functional**.

| Milestone | Status |
|-----------|--------|
| Python 3.12.8 liaison (WebSocket JSON-RPC) | ✅ stable |
| `psychopy-lib` 2026.1.2 full import | ✅ |
| Builder Components panel (35 components) | ✅ |
| `writeScript` (.py / .js output) | ✅ |
| Run-in-Browser (PsychoJS via system browser) | ✅ participant dialog, stimulus presentation |
| Auto-detect + pip install missing packages | ✅ one-click install 13 core deps |
| External URL opening (homepage, docs, Pavlovia) | ✅ multi-fallback (shell → NAPI → aa start) |
| Desktop/Documents file read/write | ✅ `requestDirectoryPermission()` |
| Python Terminal with diagnose | ✅ |

### Architecture (2026.1.2)

```
┌──────────────────────────────────────────────────┐
│                 HarmonyOS Device                   │
│  ┌──────────────────────────────────────────────┐ │
│  │            ArkUI → Electron-OH               │ │
│  │  ┌────────────────────────────────────────┐  │ │
│  │  │  harmony-python.js (main process)      │  │ │
│  │  │  ┌──────────────────────────────────┐  │  │ │
│  │  │  │  liaison_shim.py (WebSocket)     │  │  │ │
│  │  │  │  psychopy-lib 2026.1.2           │  │  │ │
│  │  │  │  PsychoJS HTTP server            │  │  │ │
│  │  │  └──────────────────────────────────┘  │  │ │
│  │  │  SvelteKit frontend (Builder/Coder)    │  │ │
│  │  │  Express :8003 static serve            │  │ │
│  │  └────────────────────────────────────────┘  │ │
│  │                                               │ │
│  │  System Python 3.12.8 (HNP)                   │ │
│  │  numpy / scipy / matplotlib / pandas / ...    │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Key Technical Achievements

- **ESM strict mode in browser**: PsychoJS experiment runs as `<script type="module">`. Dynamic variable scanner auto-declares all PsychoPy implicit globals.
- **Python f-string transpiler fix**: `_fixGeneratedJS` post-processes Python-to-JS output, fixing `f'{randint(...)}'`, `None`/`False`/`True`, `u'%'` formatting residues.
- **Device IP HTTP server**: System browser can't reach `127.0.0.1` due to HarmonyOS sandbox. HTTP server binds `0.0.0.0` and opens via device WiFi IP.
- **IIFE/ESM dual-library elimination**: Removed IIFE library to avoid dual PsychoJS singleton conflict with ESM module import.
- **Dialog CSS injection**: `_psychojsDialogCSS` provides complete styling for PsychoJS A11yDialog (participant info dialog).
- **Resource file copying**: `_copyExperimentResources` auto-copies .xlsx conditions files from experiment directory to HTTP output.
- **OpenExternal fallback chain**: `shell.openExternal` → NAPI adapters → `aa start` system command → clipboard.

## Known Issues

| Issue | Status | Plan |
|-------|--------|------|
| `libsndfile.so` not found | ⚠️ soft-fail | Camera/mic components skip with warning. Bundle .so in `libs/arm64-v8a/`. |
| Double liaison process (console noise) | ⚠️ cosmetic | `_doStartLiaison` idempotency guard in place. |
| Pavlovia OAuth / surveys | ⏳ pending | Missing `/api/token/*` routes in index.cjs. |
| Native pyglet window (GPU/X11) | ❌ not available | Use PsychoJS browser route. |

## Build Instructions

### Prerequisites

- DevEco Studio 5.0+ (HarmonyOS SDK API 15+)
- Node.js 18.x+
- HarmonyOS device (ARM64 aarch64)

### Quick Build

```bash
git checkout 2026.1.2
ohpm install
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build
cd ../../../../../../../..
# Build HAP in DevEco Studio (Build → Build HAP)
# Or CLI:
hvigorw assembleHap --no-daemon
```

## Device Requirements

- Python 3.12.8 via HNP at `/data/service/hnp/python.org/python_3.12/bin/python3`
- Auto-installs missing packages via pip on first launch
- HarmonyBrew recommended for system libs (`libsndfile`)

## Branches

| Branch | Description |
|--------|-------------|
| `2026.1.2` | **Latest** — Full experiment pipeline, auto-install, ESM support |
| `v0.1.6` | Previous stable — Python backend initial activation |
| `main` | Landing page + documentation |

## License

- Project template: Apache 2.0
- PsychoPy: [GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

---

> **Last updated: 2026-07-20 | 2026.1.2**
> GitCode: [https://gitcode.com/A9iska/psychopy-oh](https://gitcode.com/A9iska/psychopy-oh)
