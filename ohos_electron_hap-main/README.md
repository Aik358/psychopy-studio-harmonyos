# PsychoPy Studio - HarmonyOS Port

[简体中文](./README-CN.md)

**PsychoPy Studio** ported to HarmonyOS (OpenHarmony) via the Electron-on-HarmonyOS runtime. This project packages the [PsychoPy](https://psychopy.org/) experiment builder as a native HarmonyOS Application Package (HAP).

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
│   │       │   ├── python/      # Python integration modules
│   │       │   ├── logging.js   # Logging (ESM)
│   │       │   ├── usage.js     # Usage reporting (ESM)
│   │       │   ├── version.js   # Version info (ESM)
│   │       │   ├── git.js       # Git integration (ESM)
│   │       │   └── index.cjs    # Main entry (CommonJS wrapper)
│   │       └── dist/            # Svelte frontend build output
│   └── oh_modules/              # OHPM dependencies
├── hvigor/                      # Build tool config
├── build-profile.json5          # Project build config
└── oh-package.json5             # OHPM project dependencies
```

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

## Prerequisites

- **DevEco Studio** 5.0+ (with HarmonyOS SDK API 15+)
- **Node.js** 18.x+
- **ohpm** (HarmonyOS package manager) – available via `npm install -g ohos-ohpm`
- HarmonyOS device or emulator (2in1 / Tablet)

## Quick Start

### 1. Install OHPM Dependencies

```bash
cd ohos_electron_hap
# Install ohpm CLI if not available:
# npm install -g ohos-ohpm
ohpm install
```

This installs:
- `inversify@6.0.1` – DI container for the ArkTS bridge
- `reflect-metadata@0.2.1` – Reflection API
- Local `web_engine` → `electron` module linkage

### 2. Place Electron App Bundle

Copy your compiled PsychoPy (or other Electron app) into:

```
web_engine/src/main/resources/resfile/resources/app/
```

### 3. Build

```bash
# Build web_engine HAR + electron HAP
hvigorw -p module=electron@default,web_engine@default \
  -p product=default -p buildMode=debug \
  assembleHar assembleHap --parallel
```

Or open in **DevEco Studio** → **Build** → **Build Hap(s)**.

### 4. Install & Run

```bash
hdc app install electron/build/default/outputs/default/electron-default-unsigned.hap
```

Or click **Run** in DevEco Studio.

## Known Issues & Fixes

### `ERR_REQUIRE_ESM` at runtime

The Electron main process (`index.cjs`) loads several ES Modules (`logging.js`, `usage.js`, `version.js`, `git.js`, `python/index.js`). Since the parent `package.json` has `"type": "module"`, these `.js` files are treated as ESM and **cannot** be loaded via `require()` from a CommonJS `.cjs` file.

**Fix applied:** The `index.cjs` uses an async IIFE with `await import()` to load all ES Modules before the app logic runs.

### `Cannot find module 'inversify'`

The `web_engine` HAR module depends on `inversify` and `reflect-metadata` from the OHPM registry.

**Fix:** Run `ohpm install` in the project root. If `ohpm` is not installed, use `npm install -g ohos-ohpm`.

### ArkTS strict mode errors (`arkts-no-any-unknown`)

The `web_engine` ArkTS source uses `Inject.get()` without explicit generic parameters, causing type inference failures.

**Fix applied:** All `Inject.get<T>()` calls now have explicit type parameters:
```typescript
// Before
private dragDropAdapter: DragDropAdapter = Inject.get(DragDropAdapter);
// After
private dragDropAdapter: DragDropAdapter = Inject.get<DragDropAdapter>(DragDropAdapter);
```

## Debugging

### Main process (Electron)

1. In `web_engine/src/main/ets/components/WebWindow.ets`, add `--inspect=9229` to launch args
2. Forward the port: `hdc fport tcp:9229 tcp:9229`
3. Open `chrome://inspect` in Chrome

### Renderer process (Svelte)

```javascript
win.webContents.openDevTools();
```

## Application Data

| Directory | Path |
|-----------|------|
| User data | `/data/storage/el2/base/files` |
| App install | `/data/storage/el1/bundle` |
| Preferences | `{userData}/psychopy4/preferences.json` |

## License

- Project template: Apache 2.0 (see [LICENSE](./LICENSE))
- PsychoPy: [GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

## Current Status

### ✅ Build & Runtime
- **ArkTS Compilation**: ✅ Passed (all type errors fixed)
- **HAR Build (web_engine)**: ✅ Passed
- **HAP Build (electron)**: ✅ Passed
- **HAP Signing**: ✅ Passed
- **Electron Runtime**: ✅ Express server + Svelte frontend loads
- **Builder/Coder UI**: ✅ Functional (basic experiment editing works)

### ⚠️ Known Issues
- **Icons not rendering**: SVG icons in `dist/icons/` may not display properly in the HarmonyOS Electron environment
- **Python runtime**: Full PsychoPy runner requires Python/UV which are not yet available on HarmonyOS
- **Window close button**: Native window controls may not appear depending on HarmonyOS Electron implementation
- **Closing behavior**: Unsaved changes dialog is implemented but may not trigger correctly without window controls

### 📝 Recent Fixes
| Issue | Fix |
|-------|-----|
| ArkTS type errors (`any`/`unknown`) | Added explicit generics to all `Inject.get<T>()` calls |
| Missing interfaces | Added `BatteryInfo`, `OcrAdapterImage`, `GestureEvent`, `TextWord`, `PowerMonitor` |
| `ERR_REQUIRE_ESM` runtime error | Changed `index.cjs` to async IIFE with `await import()` |
| `ERR_UNSUPPORTED_DIR_IMPORT` | Changed `import("./python")` → `import("./python/index.js")` |
| `UsageReport is not a constructor` | Moved `new UsageReport()` inside async IIFE after imports resolve |
| Splash window blocking UI | Removed `alwaysOnTop`, added auto-close after 3s |
| `libelectron.so` LFS pointer | Properly tracked with Git LFS and pushed to remote |
| `WebAssembly is not defined` (Express) | No fix yet - requires HarmonyOS Electron update |
| Missing window controls | Added `frame: true` to BrowserWindow constructor |
| Unsaved changes on close | Added `dialog.showMessageBoxSync()` in window `close` event |

### 🔧 To Build
```bash
# Install OHPM dependencies
cd ohos_electron_hap
node /path/to/ohos-ohpm/bin/pm-cli.js install

# Build HAP
hvigorw --mode module -p buildMode=debug -p product=default assembleHap --info --parallel

# Install on device
hdc app install electron/build/default/outputs/default/electron-default-unsigned.hap
```
