# PsychoPy Studio - HarmonyOS Port v0.1.0

[简体中文](./ohos_electron_hap-main/README-CN.md)

## Overview

**PsychoPy Studio** is an open-source experiment builder for psychology and neuroscience. This project ports it to **HarmonyOS (OpenHarmony)** via the Electron-on-HarmonyOS runtime, packaging the PsychoPy Builder, Coder, and Runner as a native HarmonyOS Application Package (HAP) that runs on tablets and 2-in-1 devices.

Future releases will integrate the **Python backend (CPython/UV)** directly into the HAP, enabling users to edit, compile, and **run experiments entirely on their HarmonyOS devices** without external dependencies.

The main project code is in the [`ohos_electron_hap-main/`](./ohos_electron_hap-main/) subdirectory. See its [README](./ohos_electron_hap-main/README.md) for full details.

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
cd ohos_electron_hap-main
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

## License

- Project template: Apache 2.0
- PsychoPy: [GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)
