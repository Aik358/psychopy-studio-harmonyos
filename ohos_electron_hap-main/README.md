# PsychoPy Studio - HarmonyOS Port v0.1.0

[简体中文](./README-CN.md)

**PsychoPy Studio** ported to HarmonyOS (OpenHarmony) via the Electron-on-HarmonyOS runtime. This project packages the [PsychoPy](https://psychopy.org/) experiment builder as a native HarmonyOS Application Package (HAP).

## v0.1.0 Release

### Current Features

- **PsychoPy Builder**: Graphical experiment editor (drag & drop components, flow timeline)
- **PsychoPy Coder**: Code editor for Python/JS experiment scripts
- **PsychoPy Runner**: Experiment execution interface (requires Python backend)
- **View switching**: Menu → View → Show Coder/Runner (current window navigation)
- **SVG Icons**: All toolbar/component icons rendering correctly
- **Splash startup animation**: App's own startup page with loading state → auto-navigate to builder
- **Electron Express server**: Serves SvelteKit frontend on localhost:8003
- **Multi-window support**: BrowserWindow API enabled (focus management WIP on HarmonyOS)

### Known Issues

- **Python backend**: PsychoPy runner requires Python/UV runtime not yet available on HarmonyOS
- **Multi-window focus**: Additional BrowserWindows are created but may not receive focus properly
- **Native window controls**: HarmonyOS Electron frame implementation may vary

## Project Structure

```
ohos_electron_hap/
├── AppScope/                    # Application scope configuration
├── electron/                    # Entry HAP module (Ability + pages)
│   ├── src/main/ets/            # ArkUI pages (Index, SubWindow, etc.)
│   └── libs/                    # Native .so libraries (libelectron.so, etc.)
├── web_engine/                  # HAR module (core Electron runtime)
│   ├── src/main/ets/            # ArkTS bridge layer
│   │   ├── ability/             # WebAbility, WebBaseAbility
│   │   ├── components/          # WebWindow, WebSubWindow, etc.
│   │   ├── adapter/             # HarmonyOS API adapters
│   │   └── jsbindings/          # JS↔ArkTS bindings
│   ├── src/main/resources/
│   │   └── resfile/resources/app/   # PsychoPy Electron app bundle
│   │       ├── electron/src/    # Main process (index.cjs, preload.js)
│   │       └── src/             # Svelte frontend source
│   └── oh_modules/
├── hvigor/
├── build-profile.json5
└── oh-package.json5
```

## Build Instructions

### Prerequisites

- **DevEco Studio** 5.0+ (HarmonyOS SDK API 15)
- **Node.js** 18.x+ (bundled with DevEco Studio at `D:\DevEco Studio\tools\node\node.exe`)
- HarmonyOS device or emulator (2in1 / Tablet)

### Steps

```bash
# 1. Install OHPM dependencies
ohpm install

# 2. Install npm dependencies for the Electron/Svelte app
cd web_engine/src/main/resources/resfile/resources/app
npm install
npm install --save-dev @sveltejs/kit @sveltejs/adapter-static vite

# 3. Build the Svelte frontend
npx vite build

# 4. Return to project root
cd ../../../../../../../..

# 5. Build HAP
# In DevEco Studio: Build → Build Hap(s)
# Or CLI:
hvigorw --mode module -p module=electron@default assembleHap -p buildMode=debug

# 6. Install on device
hdc app install electron/build/default/outputs/default/electron-default-signed.hap
```

### First-time Setup (Signing)

The project uses automatic signing configured in `build-profile.json5`. If building for the first time on a new machine:

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
│  │  │   │  │ Process (CJS)  │  │  │  │  │
│  │  │   │  │  - index.cjs   │  │  │  │  │
│  │  │   │  │  - Express srv │  │  │  │  │
│  │  │   │  └────────────────┘  │  │  │  │
│  │  │   └──────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Future Roadmap

### Short-term
- [ ] **Python backend on HarmonyOS**: Port PsychoPy's Python runtime (CPython/UV) to work on HarmonyOS, enabling experiment execution
- [ ] **Multi-window focus fix**: Resolve BrowserWindow focus management for coder/runner views
- [ ] **File system access**: Full integration with HarmonyOS file picker for .psyexp files

### Medium-term
- [ ] **Pavlovia sync**: Git-based experiment sharing with pavlovia.org
- [ ] **Plugin system**: PsychoPy plugin manager on HarmonyOS
- [ ] **Device support**: Monitor calibration, button box, eye tracker via HarmonyOS peripheral APIs

### Long-term
- [ ] **Native backend**: Replace Electron-on-HarmonyOS with pure ArkUI implementation for better performance
- [ ] **App Store distribution**: Package for HarmonyOS AppGallery

## Application Data

| Directory | Path |
|-----------|------|
| User data | `/data/storage/el2/base/files` |
| App install | `/data/storage/el1/bundle` |
| Preferences | `{userData}/psychopy4/preferences.json` |

## License

- Project template: Apache 2.0 (see [LICENSE](./LICENSE))
- PsychoPy: [GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)
