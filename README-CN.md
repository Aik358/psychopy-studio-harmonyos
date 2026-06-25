# PsychoPy Studio - 鸿蒙移植版

[English](./README.md)

## 项目简介

**PsychoPy Studio** 是一款开源的心理学/神经科学实验设计工具。本项目将其移植到 **HarmonyOS（鸿蒙）** 平台，通过 Electron-on-HarmonyOS 运行时，将 PsychoPy 的 Builder、Coder、Runner 打包为原生鸿蒙 HAP。

**v0.1.3** — 首次在 HarmonyOS ARM64（aarch64）设备上成功自构建。前端在鸿蒙本机使用 harmonybrew 工具链编译，原生 binding 完成代码签名。

**最新稳定版**: [v0.1.2 (x86)](https://gitcode.com/A9iska/psychopy-oh/tree/v0.1.2) — 完整 Python 后端，多窗口支持。  
**开发分支**: [v0.1.3_OHOS_arm64_dev_1](https://gitcode.com/A9iska/psychopy-oh/tree/v0.1.3_OHOS_arm64_dev_1) — HarmonyOS ARM64 本机构建（Python 后端待接入）。

## 版本时间线

| 版本 | 日期 | 平台 | 状态 |
|------|------|------|------|
| **v0.1.3** ⭐ | 2026-06-25 | HarmonyOS ARM64 | **进展最领先** — 本机自构建，SVG 图标修复，Components 面板正常，原生标题栏。IPC 同步待修复。 |
| **v0.1.2** | 2026-06-24 | x86（交叉编译）| 在 x86 上编译 HAP，功能与 v0.1.3 同级。Python 后端均未接入。 |
| **v0.1.1** | 2026-06-23 | x86 | 初始移植，SVG 图标调试。 |

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

---

## v0.1.2 关键经验记录

### NPM 构建是必须的——绝不能直接复制 `dist/`

`web_engine/src/main/resources/resfile/resources/app/dist/` 目录包含**编译后的 SvelteKit 前端**（PsychoPy Builder/Coder/Runner 界面）。该目录**不被 git 追踪**，必须在本地通过以下命令生成：

```bash
cd web_engine/src/main/resources/resfile/resources/app/
npm install        # 安装 @sveltejs/kit, vite, adapter-static 等依赖
npx vite build     # 生成 ./dist/（输出到 .svelte-kit/output/client/ + ./dist/）
```

**为什么必须在本地构建（踩坑历史）：**

- 直接 `Copy-Item` 或手动从其他项目/git分支复制 `dist/` 会导致**图标渲染失败**（SVG 图标显示为空白/缺失）。
- `dist/` 包含的编译后 JS 中嵌入了**特定于该版本源码的资产路径、图标引用（`/icons/btn-*.svg`、`/icons/sym-*.svg`）和 Svelte 组件绑定**。
- 图标加载依赖 SvelteKit 编译的 chunk 系统；来自不同构建的过期 chunk 会产生错误的 `<img>` 或 `<svg><use>` 引用。
- **症状**：应用正常启动，所有界面文字和交互功能正常，但**工具栏和组件图标全不显示**——只留下空白占位区域。
- **修复**：始终在 `resources/app/` 目录下运行 `npx vite build`，**不要从项目根目录运行**，**绝不复用其他项目的 `dist/`**。

### 完整构建流水线

```
源码文件（src/ + static/）
    → npx vite build
        → dist/（编译后的前端）
            → hvigorw assembleHar（构建 web_engine HAR）
                → hvigorw assembleHap（构建 electron HAP）
                    → 签名后的 HAP → 设备安装
```

### 前端开发工作流

1. 编辑 Svelte 源文件（`resources/app/src/` 目录下）
2. 在该目录下运行 `npx vite build`
3. 运行 `hvigorw --mode module -p module=web_engine@default assembleHar`
4. 运行 `hvigorw --mode module -p module=electron@default assembleHap`
5. 通过 `hdc install .../electron-default-signed.hap` 安装到设备

### 注意事项

- 构建主机需要 Node.js 环境（DevEco Studio 自带的 Node.js 可用：`D:\DevEco Studio\tools\node\node.exe`）
- `node_modules/` **不应提交到 git**（在 `.gitignore` 中忽略）
- `npx vite build` **必须在正确的目录**（`resources/app/`）下运行
- `package.json` 故意没有 `"scripts"` 字段——直接使用 `npx vite build`
- Vite 构建会同时生成 `.svelte-kit/output/` 和 `dist/`——只有 `dist/` 被打包进 HAP
- 如果图标不显示，**先重新运行 `npx vite build`**，而不是手动修复 JS 或复制 dist/

---

## 🚀 v0.1.2-HarmonyOS-Device-Dev-Test（2026-06-24）

### 分支
[`v0.1.2-HarmonyOS-Device-Dev-Test`](https://gitcode.com/A9iska/psychopy-oh/tree/v0.1.2-HarmonyOS-Device-Dev-Test)

### 概述
首次在 HarmonyOS 设备本机（HongMeng Kernel 1.12.0，aarch64）进行的设备端调试。使用 harmonybrew 工具链纯本机构建。

### v0.1.1 → v0.1.2 变更

| 领域 | 说明 |
|------|------|
| **新版 landing page** | 完整重写 `index.html`——4 个交互式演示面板：Gabor 刺激、掩蔽启动、EEG 触发模拟、眼动追踪。中英双语 i18n。 |
| **项目结构** | 目录扁平化。移除嵌套的 `ohos_electron_hap-main/`。所有模块（`electron/`、`web_engine/`、`chromium/`、`AppScope/`）位于项目根目录。 |
| **构建配置** | `compatibleSdkVersion`: `6.1.0(23)`，`compileSdkVersion`: `6.1.0(23)`，`targetSdkVersion`: `6.1.0(23)`。清理签名配置中的机器相关凭证。 |
| **SDK** | HarmonyOS SDK 26.0.0.18 Beta（API 26），通过 harmonybrew 安装。 |
| **应用名** | 从 `Electron` 改为 `PsychoPy Studio`。 |

### 构建状态

| 步骤 | 状态 |
|------|------|
| `hvigorw assembleHap` | ✅ **BUILD SUCCESSFUL**（18秒，82ms） |
| HAP 大小 | 214MB（`electron-default-signed.hap`） |
| 资源冲突 | ⚠️ `button_cancel`、`button_ok`、`button_background`、`button_font`、`checkbox_selected`、`start_window_background`——在 `electron/` 和 `web_engine/` 模块间重复声明。需要去重。 |
| ArkTS 警告 | ⚠️ 50+ 条 `arkts-no-classes-as-obj` 警告（`web_engine/` 适配器绑定）。不阻塞构建，但应在 API 26 兼容性清理中处理。 |
| 弃用 API 警告 | ⚠️ 多处（`show`、`getContext`、`getFontByName`、`Locale`、`vp2px`、`back`、`getParams`、`showToast`、`pushUrl`、`getShared`、`decodeWithStream`、`setLocalName`、`getSystemLocale`）。需迁移至 v26 对应 API。 |
| DevEco Studio Run | ❌ Run 按钮灰色——项目同步仍有问题。变通方案：通过 CLI `hvigorw` 构建，手动安装。 |

### 本分支已知问题

1. **DevEco Studio Run 按钮灰色**——项目同步间歇性失败。建议：从上游重新克隆，重新应用配置。
2. **资源冲突**——`electron/` 和 `web_engine/` 模块声明了相同的 string/color 资源（`button_cancel`、`button_ok` 等）。首个声明生效，但应通过从 `web_engine/` 移除重复项来解决。
3. **`dist/` 目录为空**——`web_engine/` 预构建前端 `dist/` 在此签出中不存在。需要在标准 PC 上运行 `npm install && npx vite build` 以恢复图标渲染。
4. **无 `oh_modules/`**——清理缓存后 OHPM 依赖未恢复。构建前运行 `ohpm install`。
5. **未包含 Python 后端**——没有捆绑 CPython/CPython 运行时。实验执行需要外部环境支持。

### 全新开始

```bash
# 1. 克隆分支
git clone -b v0.1.2-HarmonyOS-Device-Dev-Test https://gitcode.com/A9iska/psychopy-oh.git
cd psychopy-oh

# 2. 安装 OHPM 依赖
ohpm install

# 3. 在标准 PC 上构建前端（见上方说明）
#    或从已有的构建中复制预构建的 dist/

# 4. 构建 HAP
hvigorw --mode module -p module=electron@default -p product=default -p buildMode=debug assembleHap --no-daemon

# 5. 安装到设备
hdc install electron/build/default/outputs/default/electron-default-signed.hap
```

### 后续步骤

- [ ] 从上游重新克隆，重新应用设备特定配置
- [ ] 去重 `electron/` 和 `web_engine/` 模块间的资源
- [ ] 将弃用 ArkTS API 迁移至 HarmonyOS SDK 26 等效 API
- [ ] 在标准 PC 上构建前端 `dist/`
- [ ] 解决 DevEco Studio 同步问题以启用 Run 按钮
- [ ] 集成 Python 后端（HarmonyOS 的 CPython/UV）
