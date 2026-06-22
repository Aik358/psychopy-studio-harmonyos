# PsychoPy Studio - 鸿蒙移植版

[English](./README.md)

**PsychoPy Studio** 移植到鸿蒙（OpenHarmony）平台的实现方案。该项目将 [PsychoPy](https://psychopy.org/) 实验设计工具打包为原生鸿蒙应用包（HAP）。

## 项目结构

```
ohos_electron_hap/
├── AppScope/                    # 应用范围配置
├── electron/                    # 入口 HAP 模块（Ability + 页面）
│   ├── src/main/ets/            # ArkUI 页面（Index, SubWindow 等）
│   └── libs/                    # 原生 so 库（libelectron.so 等）
├── web_engine/                  # HAR 模块（核心 Electron 运行时）
│   ├── src/main/ets/            # ArkTS 桥接层
│   │   ├── ability/             # WebAbility, WebBaseAbility
│   │   ├── components/          # WebWindow, WebSubWindow 等
│   │   ├── adapter/             # 鸿蒙 API 适配器
│   │   └── jsbindings/          # JS↔ArkTS 绑定
│   ├── src/main/resources/
│   │   └── resfile/resources/app/   # PsychoPy Electron 应用包
│   │       ├── electron/src/    # 主进程（index.cjs, preload.js）
│   │       │   ├── python/      # Python 集成模块
│   │       │   ├── logging.js   # 日志（ESM）
│   │       │   ├── usage.js     # 使用统计（ESM）
│   │       │   ├── version.js   # 版本信息（ESM）
│   │       │   ├── git.js       # Git 集成（ESM）
│   │       │   └── index.cjs    # 主入口（CommonJS 包装）
│   │       └── dist/            # Svelte 前端构建产物
│   └── oh_modules/              # OHPM 依赖
├── hvigor/                      # 构建工具配置
├── build-profile.json5          # 项目构建配置
└── oh-package.json5             # OHPM 项目依赖
```

## 架构

```
┌─────────────────────────────────────────┐
│            HarmonyOS 设备                 │
│  ┌───────────────────────────────────┐  │
│  │         ArkUI (Ability)           │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   XComponent（原生容器）       │  │  │
│  │  │   ┌──────────────────────┐  │  │  │
│  │  │   │ libelectron.so       │  │  │  │
│  │  │   │  ┌────────────────┐  │  │  │  │
│  │  │   │  │ Electron 主进程  │  │  │  │  │
│  │  │   │  │    index.cjs    │  │  │  │  │
│  │  │   │  │  Express 服务器  │  │  │  │  │
│  │  │   │  └────────────────┘  │  │  │  │
│  │  │   └──────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 环境要求

- **DevEco Studio** 5.0+（HarmonyOS SDK API 15+）
- **Node.js** 18.x+
- **ohpm**（鸿蒙包管理器）— 可通过 `npm install -g ohos-ohpm` 安装
- 鸿蒙设备或模拟器（2in1 / 平板）

## 快速开始

### 1. 安装 OHPM 依赖

```bash
cd ohos_electron_hap
# 如 ohpm 未安装：
# npm install -g ohos-ohpm
ohpm install
```

将安装：
- `inversify@6.0.1` – ArkTS 桥接层 DI 容器
- `reflect-metadata@0.2.1` – 反射 API
- 本地 `web_engine` → `electron` 模块链接

### 2. 放置 Electron 应用

将编译好的 PsychoPy（或其他 Electron 应用）复制到：

```
web_engine/src/main/resources/resfile/resources/app/
```

### 3. 构建

```bash
# 构建 web_engine HAR + electron HAP
hvigorw -p module=electron@default,web_engine@default \
  -p product=default -p buildMode=debug \
  assembleHar assembleHap --parallel
```

或在 **DevEco Studio** 中 → **Build** → **Build Hap(s)**。

### 4. 安装运行

```bash
hdc app install electron/build/default/outputs/default/electron-default-unsigned.hap
```

或在 DevEco Studio 中点击运行。

## 常见问题与修复

### 运行时 `ERR_REQUIRE_ESM`

Electron 主进程（`index.cjs`）需要加载多个 ES Module（`logging.js`、`usage.js`、`version.js` 等）。由于父级 `package.json` 中有 `"type": "module"`，这些 `.js` 文件被当作 ESM，不能从 CommonJS 的 `.cjs` 文件中用 `require()` 加载。

**已修复：** `index.cjs` 采用 async IIFE + `await import()` 异步加载所有 ES Module。

### `Cannot find module 'inversify'`

`web_engine` HAR 模块依赖 OHPM 仓库的 `inversify` 和 `reflect-metadata`。

**修复：** 在项目根目录运行 `ohpm install`。如 `ohpm` 未安装：`npm install -g ohos-ohpm`。

### ArkTS 严格模式错误（`arkts-no-any-unknown`）

`web_engine` 的 ArkTS 源码中使用 `Inject.get()` 时未指定泛型参数，导致类型推导失败。

**已修复：** 所有 `Inject.get<T>()` 调用添加了显式泛型：
```typescript
// 之前
private dragDropAdapter: DragDropAdapter = Inject.get(DragDropAdapter);
// 之后
private dragDropAdapter: DragDropAdapter = Inject.get<DragDropAdapter>(DragDropAdapter);
```

## 调试

### 主进程（Electron）

1. 在 `web_engine/src/main/ets/components/WebWindow.ets` 中添加 `--inspect=9229` 启动参数
2. 端口转发：`hdc fport tcp:9229 tcp:9229`
3. Chrome 打开 `chrome://inspect`

### 渲染进程（Svelte）

```javascript
win.webContents.openDevTools();
```

## 应用数据

| 目录 | 路径 |
|------|------|
| 用户数据 | `/data/storage/el2/base/files` |
| 应用安装 | `/data/storage/el1/bundle` |
| 偏好设置 | `{userData}/psychopy4/preferences.json` |

## 许可

- 项目模板：Apache 2.0（见 [LICENSE](./LICENSE)）
- PsychoPy：[GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)
