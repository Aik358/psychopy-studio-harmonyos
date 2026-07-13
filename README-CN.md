# PsychoPy Studio - 鸿蒙 ARM64 移植版 v0.1.4

[English](./README.md) | [项目首页](https://A9iska.gitee.io/psychopy-oh)

## 概述

**PsychoPy Studio** 是一款开源的心理学/神经科学实验设计工具。本项目将其移植到 **HarmonyOS（鸿蒙）** 平台，通过 Electron-on-HarmonyOS 运行时，将 PsychoPy 的 Builder、Coder、Runner 打包为原生鸿蒙 HAP。

**关键成果**：首次在 **HarmonyOS ARM64（aarch64）** 设备上成功构建并运行，包括在前端 `dist/` 在鸿蒙本机使用 harmonybrew 工具链完成编译。

> **最新版为 v0.1.4**，请切换到 `v0.1.4` 分支获取。下载后需在 DevEco Studio 中配置自动签名。

## v0.1.4 更新日志 (2026-06-25)

### 视图切换全面重构

- **NEW**: `sharedViewStore.svelte.js` — 模块级响应式 Store，跨视图状态持久化
- **FIX**: 视图切换不再丢失 Builder/Coder/Runner 状态
- **FIX**: `goto()` 客户端导航替代全页刷新
- **FIX**: Builder 实验状态在切换视图时自动保存，返回时自动恢复
- **FIX**: Coder 现在显示 Builder 生成的实验代码（JSON 结构化视图）
- **FIX**: Runner 运行列表在视图切换间保持
- **NEW**: Electron IPC `electron.windows.state.save/load` 跨窗口状态同步
- **NEW**: `preload.js` 暴露 `windows.state` 桥接
- **CHANGED**: `showWindow()` 回退到 `goto()` 导航（无现有窗口时）
- **KNOWN**: 鸿蒙原生多窗口功能尚未实现（已推迟）

### 使用方式

```bash
# 切换到 v0.1.4 分支
git checkout v0.1.4

# 构建前端
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build
cd ../../../../../../../..

# 构建 HAP（需先在 DevEco Studio 中配置自动签名）
hvigorw --mode module -p module=electron@default assembleHap --no-daemon
```

## v0.1.2 功能

- **ARM64 本机构建** — `vite build` 可在 HarmonyOS 设备上直接运行
- **PsychoPy Builder** — 图形化实验编辑器（拖拽组件、流程时间线）
- **PsychoPy Coder** — Python/JS 代码编辑器
- **PsychoPy Runner** — 实验执行界面（需 Python 后端）
- **视图切换** — 页面内 Builder/Coder/Runner 导航标签
- **原生窗口标题栏** — 鸿蒙系统原生最小化/最大化/关闭按钮
- **SVG 图标** — 通过内联 SVG 渲染修复 CSS 变量继承问题
- **Components 面板** — 使用本地 fallback 配置文件，无需 Python 依赖
- **Electron Express 服务** — localhost:8003 提供 SvelteKit 前端

## 构建步骤

### 环境要求

- DevEco Studio 5.0+（HarmonyOS SDK API 15+）
- HarmonyOS 设备或模拟器（ARM64 aarch64）
- harmonybrew（Node.js v26.3.1、binary-sign-tool）

### 快速构建

```bash
# 1. 安装 OHPM 依赖
ohpm install

# 2. 在标准 PC 上构建前端（本机构建见 BUILD_ON_ARM64.md）
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build
cd ../../../../../../../..

# 3. 构建 HAP
hvigorw --mode module -p module=web_engine@default,electron@default -p product=default -p buildMode=debug assembleHar assembleHap --no-daemon
```

### 鸿蒙本机构建前端

详见 [BUILD_ON_ARM64.md](./BUILD_ON_ARM64.md) —— 包含原生 binding 签名、WASM 回退等完整攻略。

## 已知问题

- **Python 后端**：实验运行需要 Python/UV 运行时，已用 IPC stub 跳过，等待后续适配
- **ArkTS 警告**：`arkts-no-classes-as-obj` 警告（非阻塞）
- **弃用 API**：多处（`show`、`getContext`、`getFontByName` 等）需迁移至 SDK 26

## 开发工作流

1. 编辑 Svelte 源文件（`web_engine/.../resources/app/src/`）
2. 运行 `npx vite build`（标准 PC 或参考 BUILD_ON_ARM64.md）
3. 运行 `hvigorw --mode module -p module=web_engine@default assembleHar`
4. 运行 `hvigorw --mode module -p module=electron@default assembleHap`

## 分支

| 分支 | 说明 |
|------|------|
| `v0.1.4` | **最新** — 视图切换重构 + 状态持久化 |
| `v0.1.3_OHOS_arm64_dev_1` | ARM64 本机构建（已在真机跑通） |
| `v0.1.3_OHOS_x86_dev_1` | x86/Windows 开发版（签名留空） |
| `v0.1.2` | 前端修复版本 |
| `v0.1.2-HarmonyOS-Device-Dev-Test` | ARM64 本机构建实验 |

## 许可

- 项目模板：Apache 2.0
- PsychoPy：[GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

---

> **最后更新：2026-06-25 | v0.1.4**
> 完整鸿蒙 ARM64 构建攻略（含故障排除、原生签名、WASM 回退）见 [BUILD_ON_ARM64.md](./BUILD_ON_ARM64.md)。
> 项目首页：[https://A9iska.gitee.io/psychopy-oh](https://A9iska.gitee.io/psychopy-oh)
> v0.1.1 调试日志见 [README-CN-v011.md](./README-CN-v011.md)。
