# PsychoPy Studio - 鸿蒙移植版 v0.1.0

[English](./README.md)

## 项目简介

**PsychoPy Studio** 是一款开源的心理学/神经科学实验设计工具。本项目将其完整移植到 **HarmonyOS（鸿蒙）** 平台，通过 Electron-on-HarmonyOS 运行时，将 PsychoPy 的实验构建器、代码编辑器、运行器打包为原生鸿蒙应用（HAP），在平板/2in1 设备上原生运行。

后续版本将把 **Python 后端（CPython/UV）** 集成到 HAP 中，让用户能够在自己的鸿蒙设备上直接 **编辑、编译并运行实验**，无需任何外部依赖。

## v0.1.0 功能

- **PsychoPy Builder**：图形化实验编辑器（拖拽组件、流程时间线）
- **PsychoPy Coder**：Python/JS 代码编辑器
- **PsychoPy Runner**：实验执行界面（需 Python 后端）
- **视图切换**：Menu → View → Show Coder/Runner（当前窗口导航）
- **SVG 图标**：全部工具栏和组件图标正常渲染
- **启动动画**：自带启动页（加载状态 → 自动进入 Builder）
- **Electron Express 服务**：localhost:8003 提供 SvelteKit 前端
- **多窗口支持**：BrowserWindow API 已启用（焦点管理 WIP）

## 构建步骤

### 环境要求
- DevEco Studio 5.0+（HarmonyOS SDK API 15）
- Node.js 18.x+
- 鸿蒙设备或模拟器（平板/2in1）

### 构建命令

```bash
# 1. 安装 OHPM 依赖
ohpm install

# 2. 安装 npm 依赖并构建前端
cd web_engine/src/main/resources/resfile/resources/app
npm install
npm install --save-dev @sveltejs/kit @sveltejs/adapter-static vite
npx vite build
cd ../../../../../../../..

# 3. 构建 HAP（或在 DevEco Studio 中 Build → Build Hap(s)）
hvigorw --mode module -p module=electron@default assembleHap -p buildMode=debug

# 4. 安装到设备
hdc app install electron/build/default/outputs/default/electron-default-signed.hap
```

### 首次构建签名
1. 用 DevEco Studio 打开项目
2. File → Project Structure → Signing Configs
3. 勾选 "Automatically generate signature"
4. 构建

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

## 已知问题

- **Python 后端**：实验运行需要 Python/UV 运行时，鸿蒙上尚未移植
- **多窗口焦点**：新 BrowserWindow 已创建但焦点管理待完善
- **原生窗口控件**：HarmonyOS Electron 窗口边框实现因版本而异

## 未来路线

### 短期
- [ ] Python 后端移植（CPython/UV for HarmonyOS）
- [ ] 多窗口焦点修复
- [ ] 文件系统集成（.psyexp 文件选择）

### 中期
- [ ] Pavlovia 同步（Git 实验分享）
- [ ] 插件系统
- [ ] 外设支持（显示器校准、按钮盒）

### 长期
- [ ] 纯 ArkUI 实现
- [ ] 鸿蒙应用市场上架

## 应用数据

| 目录 | 路径 |
|------|------|
| 用户数据 | `/data/storage/el2/base/files` |
| 应用安装 | `/data/storage/el1/bundle` |
| 偏好设置 | `{userData}/psychopy4/preferences.json` |

## 许可

- 项目模板：Apache 2.0
- PsychoPy：[GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)
