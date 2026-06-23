# PsychoPy Studio - 鸿蒙移植版 v0.1.1

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

---

> **最后更新：2026-06-23 15:57 CST**  
> 本文档记录了一次在 HarmonyOS 设备（MatePad Edge）本机开发调试过程中遇到的关键问题和解决方案，供后续开发者参考。

## 🧪 2026-06-23 调试记录

### 背景

本项目使用 SvelteKit 构建前端 → Vite 打包 → 输出到 `dist/` → 放入 `resfile/` → Electron 通过 Express 静态服务加载。SVG 图标存放在 `static/icons/`，编译时复制到 `dist/icons/`。

### 问题现象

应用启动正常（Builder 界面可见、按钮可点击），但**所有 SVG 图标显示为空白**。工具栏、组件面板（Stimuli/Responses 等）的图标均不可见。

### 根因分析

| 原因 | 说明 |
|------|------|
| **CSS 变量不传递** | SVG 图标使用 `fill:var(--outline)`、`stroke:var(--text)` 等 CSS 变量。当 SVG 被 `<img>` 或 `<use>` 加载为外部文档时，**HTML 页面的 CSS 变量不会传递进 SVG 上下文**，导致颜色不可见。 |
| **`npx vite build` 不可用** | HarmonyOS 内置 Node.js 22.7.0，但 Vite 6.x 要求 ≥20.19+ 或 ≥22.12+。即使通过 Homebrew 升级到 26.3.1，`@rolldown/binding-openharmony-arm64` 原生模块加载时被系统安全机制拦截（`Error loading shared library: Permission denied`）。 |
| **npm 在 HarmonyOS 上不稳定** | `npm install` 在多次尝试中出现原生崩溃（native stack trace），`package-lock.json` 曾被删除后无法重建。 |

### 尝试过的修复方案

| 时间 | 方案 | 结果 |
|------|------|------|
| 上午 | 将 `build-profile.json5` 中 `targetSdkVersion` 从 `26.0.0` 改为 `6.1.0(23)` | 构建报错 00306042（版本格式不一致），改回 `26.0.0` 后修复 |
| 上午 | 修改 `Icon.svelte` 从 `<use>` 改为 `fetch() + 内联渲染` | 需要 `npx vite build` 才能生效，无法编译 |
| 中午 | 修改 `Icon.svelte` 从 `fetch()` 改回 `<use href={asset(src)}>` | 同上 |
| 中午 | 修改 `Icon.svelte` 使用 `<img>` 代替 `<svg><use>` | 同上 |
| 中午 | Express 注入 `<use>`→`<img>` 转换脚本 | 脚本执行但图标仍不显示（CSS 变量问题） |
| 中午 | Express 添加 URL 重写中间件 | 路径拼接 bug 导致白屏，修正后恢复 |
| 下午 | 添加 SVG CORS 头 `Access-Control-Allow-Origin: *` | 无效 |
| 下午 | Express 添加显式静态文件路由 | 路径拼接 bug（`path.join` 被绝对路径覆盖），修正后恢复 |
| 下午 | 直接修改 `dist/` 编译产物（`Bz6sfiOo.js`），将 `<use>` 替换为 `<img>` | 图标仍不可见（CSS 变量问题） |
| 下午 | 替换所有 SVG 文件中 CSS 变量为硬编码颜色 | Electron 启动异常，已回退 |
| 全天 | `git push --force` 多次回退/重写历史 | 远程仓库多次冲突 |

### 教训总结

1. **`dist/` 必须提交到 git** — `.gitignore` 最初忽略了 `dist/`，导致其他用户克隆后需要自行 `npx vite build`。已修复（从 `.gitignore` 移除）。
2. **`targetSdkVersion` 与 `compatibleSdkVersion` 格式必须一致** — API 10-25 用 `productVersion(apiLevel)` 格式（如 `6.1.0(23)`），API 26+ 用纯版本号格式（如 `26.0.0`）。不可混用。
3. **CSS 变量在外部 SVG 中不生效** — 如果 SVG 通过 `<img>` 或 `<use>` 加载，`var(--outline)` 等不会从 HTML 页面继承。解决方式有二：
   - 用 `fetch()` 拉取 SVG 内容 → 内联渲染（`{@html svgContent}`）→ CSS 变量可继承
   - 或将 SVG 中的 CSS 变量替换为硬编码颜色
4. **不要在本机（HarmonyOS）上尝试前端构建** — `npx vite build` 和 `npm install` 均不可靠。前端构建应在标准 Linux/macOS/Windows 电脑上完成。

### 推荐构建方式

由于 HarmonyOS 本机的 Node.js 版本限制和原生模块兼容性问题，**请使用以下任一方式构建前端**：

#### 方式一：在标准电脑上构建（推荐）

```bash
# 在安装了 Node.js 22.12+ 的 Linux/macOS/Windows 电脑上：
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build

# 将 dist/ 目录复制回 HarmonyOS 设备
# 然后在设备上构建 HAP
cd /path/to/project
hvigorw clean --no-daemon
hvigorw --mode module -p module=electron@default -p product=default -p buildMode=debug assembleHap --no-daemon
```

#### 方式二：使用仓库中的预构建 dist/

当前仓库已包含 `dist/`（6 月 18 日构建），理论上无需重建前端即可构建 HAP。但此版本的前端代码与当前 `Icon.svelte` 源码已不同步，图标渲染可能存在兼容性问题。

#### 方式三：等待 DevEco Studio 更新

截止 2026-06-23，DevEco Studio for HarmonyOS 对本项目的完整构建链支持有限。如果未来版本更新了内置 Node.js（≥22.12）或修复了原生模块加载限制，可以在本机完成全部构建。

### 相关文件位置

| 文件 | 路径 |
|------|------|
| 图标组件 | `web_engine/src/main/resources/resfile/resources/app/src/lib/utils/icons/Icon.svelte` |
| SVG 源文件 | `web_engine/src/main/resources/resfile/resources/app/static/icons/` |
| 编译后图标 | `web_engine/src/main/resources/resfile/resources/app/dist/icons/` |
| Express 服务器 | `web_engine/src/main/resources/resfile/resources/app/electron/src/index.cjs` |
| 构建配置 | `build-profile.json5` |
| 前端配置 | `web_engine/src/main/resources/resfile/resources/app/svelte.config.js` |
| Vite 配置 | `web_engine/src/main/resources/resfile/resources/app/vite.config.ts` |
