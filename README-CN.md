# PsychoPy Studio - 鸿蒙 ARM64 移植版 v0.1.2

[English](./README.md)

## 概述

**PsychoPy Studio** 是一款开源的心理学/神经科学实验设计工具。本项目将其移植到 **HarmonyOS（鸿蒙）** 平台，通过 Electron-on-HarmonyOS 运行时，将 PsychoPy 的 Builder、Coder、Runner 打包为原生鸿蒙 HAP。

**关键成果**：首次在 **HarmonyOS ARM64（aarch64）** 设备上成功构建并运行，包括在前端 `dist/` 在鸿蒙本机使用 harmonybrew 工具链完成编译。

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
| `v0.1.2` | 最新功能 + 前端修复 |
| `v0.1.2-HarmonyOS-Device-Dev-Test` | ARM64 本机构建实验 |
| `v0.1.1` | 上一个稳定版本 |

## 许可

- 项目模板：Apache 2.0
- PsychoPy：[GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

---

> **最后更新：2026-06-25**
> 完整鸿蒙 ARM64 构建攻略（含故障排除、原生签名、WASM 回退）见 [BUILD_ON_ARM64.md](./BUILD_ON_ARM64.md)。
> v0.1.1 调试日志见 [README-CN-v011.md](./README-CN-v011.md)。
