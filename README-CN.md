# PsychoPy Studio — 鸿蒙移植版

[English](./README.md) | [项目首页](https://aik358.github.io/psychopy-studio-harmonyos/)

## 项目简介

**PsychoPy Studio** 是一款开源的心理学/神经科学实验设计工具。本项目将其移植到 **HarmonyOS（鸿蒙）** 平台，通过 Electron-on-HarmonyOS 运行时，将 PsychoPy 的 Builder、Coder、Runner 打包为原生鸿蒙 HAP。

> **最新版: v0.1.6** — 请切换到 `v0.1.6` 分支。下载后需在 DevEco Studio 中配置自动签名。

## v0.1.6 更新内容 (2026-07-12)

### Python 后端 — 已激活

Python 集成层现已**启用**——不再是 stub。全部 30+ 个 IPC handler（liaison / venv / uv / shell / scripts / psychojs / harmony）已注册并可用。

| 里程碑 | 状态 |
|--------|------|
| 系统Python 3.12.8 检测成功（麒麟 X90a HNP 路径） | ✅ |
| `psychopy-lib` 2026.2.0 导入成功（mock PyQt6/wx） | ✅ |
| `liaison_shim.py` — 纯 Python WebSocket JSON-RPC 服务 | ✅ |
| PsychoPy ↔ Electron IPC 通信 `localhost:8004` | ✅ |
| `harmony.js` 诊断引擎（包检测、版本检查、pip/venv 能力） | ✅ |
| 自动安装缺失依赖（`pip3 install --user`） | ✅ |
| 分层降级：系统Python → venv → harmonybrew → 手动 | ✅ |
| Builder/Coder/Runner 前端与 Python 后端连接 | ✅ |
| PsychoJS 浏览器实验执行（Chromium WebGL） | ⏳ 待 HAP 部署 |
| 原生 pyglet 窗口创建（需 GPU/X11） | ❌ 鸿蒙不可用 |

### 架构图 (v0.1.6)

```
┌──────────────────────────────────────────────────┐
│                  鸿蒙设备                          │
│  ┌──────────────────────────────────────────────┐ │
│  │            ArkUI (Ability)                    │ │
│  │  ┌────────────────────────────────────────┐  │ │
│  │  │       XComponent（原生容器）             │  │ │
│  │  │   ┌──────────────────────────────────┐ │  │ │
│  │  │   │  libelectron.so (Chromium 132)   │ │  │ │
│  │  │   │  ┌─────────────────────────────┐ │  │ │
│  │  │   │  │    Electron 主进程           │ │  │ │
│  │  │   │  │     index.cjs               │ │  │ │
│  │  │   │  │     Express :8003           │ │  │ │
│  │  │   │  │  ┌───────────────────────┐  │ │  │ │
│  │  │   │  │  │  Python 集成层         │  │ │  │ │
│  │  │   │  │  │  harmony.js (检测)     │  │ │  │ │
│  │  │   │  │  │  venv.js (环境管理)    │  │ │  │ │
│  │  │   │  │  │  liaison.js (IPC)      │  │ │  │ │
│  │  │   │  │  │  psychojs.js (服务器)   │  │ │  │ │
│  │  │   │  │  │  ───────────────────  │  │ │  │ │
│  │  │   │  │  │  liaison_shim.py      │  │ │  │ │
│  │  │   │  │  │  (WebSocket JSON-RPC) │  │ │  │ │
│  │  │   │  │  │  psychopy_worker.py   │  │ │  │ │
│  │  │   │  │  │  (代码生成)            │  │ │  │ │
│  │  │   │  │  └───────────────────────┘  │ │  │ │
│  │  │   │  └─────────────────────────────┘ │  │ │
│  │  │   └──────────────────────────────────┘ │  │ │
│  │  │                                          │ │
│  │  │  系统Python 3.12.8 (HNP)                 │ │
│  │  │  numpy / scipy / matplotlib / Pillow     │ │
│  │  └──────────────────────────────────────────┘ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Python 安装引导（分层）

应用自动检测 Python 环境并引导用户完成安装：

1. **系统 Python**（HNP）— 如果 Python 3.9+ 存在且包完整 → 直接使用，零安装
2. **自动安装** — `pip3 install --user numpy scipy pillow pyglet websockets esprima psychopy-lib --no-deps`
3. **venv 降级** — 如果 `--user` 被拒绝：`python3 -m venv ~/.psychopy-venv` + 隔离安装
4. **harmonybrew** — 如果无系统 Python：`brew install python@3.12`
5. **手动安装** — HNP 安装或源码编译指引

### Liaison 通信

官方 `liaison-py` 依赖 `rpds-py` → `maturin` → Rust 编译器，鸿蒙上无法编译。解决方案：**`liaison_shim.py`** — 纯 Python WebSocket JSON-RPC 服务（397 行，零编译，仅依赖 `websockets` 库）。已在鸿蒙设备上验证通过。

## 版本时间线

| 版本 | 日期 | 关键成果 | 分支 |
|------|------|----------|------|
| **v0.1.6** ⭐ | 2026-07-12 | Python 后端激活，liaison_shim.py，分层安装引导 | `v0.1.6` |
| v0.1.5 | 2026-07-11 | PsychoJS 浏览器实验验证，PIXI.js 修复 | `v0.1.5` |
| v0.1.4 | 2026-06-25 | 视图切换重构、状态持久化 | `v0.1.4` |
| v0.1.3 | 2026-06-25 | ARM64 本机自构建，SVG 图标，Components 面板 | `v0.1.3_OHOS_arm64_dev_1` |
| v0.1.2 | 2026-06-24 | x86 交叉编译，落地页，中英双语 | `v0.1.2-HarmonyOS-Device-Dev-Test` |

## 构建步骤

### 环境要求

- DevEco Studio 5.0+（HarmonyOS SDK API 15+）
- Node.js 18.x+（用于前端构建）
- 鸿蒙设备或模拟器（ARM64 aarch64）

### 快速构建

```bash
# 1. 切换到 v0.1.6 分支
git checkout v0.1.6

# 2. 安装 OHPM 依赖
ohpm install

# 3. 构建前端
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build
cd ../../../../../../../..

# 4. 构建 HAP（需先在 DevEco Studio 中配置自动签名）
hvigorw --mode module -p module=web_engine@default,electron@default -p product=default -p buildMode=debug assembleHar assembleHap --no-daemon

# 5. 安装到设备
hdc app install electron/build/default/outputs/default/electron-default-signed.hap
```

### 鸿蒙本机构建前端

详见 [BUILD_ON_ARM64.md](./BUILD_ON_ARM64.md) —— 包含原生 binding 签名、WASM 回退等完整攻略。

## 设备验证（麒麟 X90a，2026-07-12）

| 组件 | 状态 |
|------|------|
| Python 3.12.8 (HNP) | ✅ `/data/service/hnp/python.org/python_3.12/` |
| numpy 2.2.1 / scipy 1.14.1 / matplotlib 3.10.0 | ✅ 已预装 |
| Pillow 11.0.0 / pyglet 1.5.27 | ✅ 已预装 |
| `pip3 install psychopy-lib --no-deps` | ✅ 可行（mock PyQt6/wx） |
| `pip3 install websockets` | ✅ 纯 Python，零编译 |
| `liaison_shim.py` WebSocket 服务 | ✅ `localhost:8004` 验证通过 |
| psychopy-lib 2026.2.0 导入 | ✅ 全部模块加载正常 |
| 原生 pyglet 窗口 | ❌ 无 GPU/X11 库 |
| liaison-py (rpds-py/maturin/Rust) | ❌ 无法编译 |
| Electron-OH HAP 部署 | ⏳ 待完成 |

## 已知问题

- **图形层**：原生 pyglet 窗口创建失败（无 GPU/X11）。实验执行使用 PsychoJS 浏览器路线（Chromium WebGL）。
- **ArkTS 警告**：`arkts-no-classes-as-obj` 警告（非阻塞）。
- **弃用 API**：多处（`show`、`getContext`、`getFontByName` 等）需迁移至 SDK 26。

## 分支

| 分支 | 说明 |
|------|------|
| `v0.1.6` | **最新** — Python 后端激活，liaison_shim.py，分层安装引导 |
| `v0.1.5` | PsychoJS 浏览器实验验证 |
| `v0.1.4` | 视图切换重构 + 状态持久化 |
| `v0.1.3_OHOS_arm64_dev_1` | ARM64 本机构建（已在真机跑通） |
| `v0.1.2-HarmonyOS-Device-Dev-Test` | ARM64 本机构建实验 |
| `test-shim` | 活跃开发分支 |
| `main` | 落地页 + 文档 |

## 许可

- 项目模板：Apache 2.0
- PsychoPy：[GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

---

> **最后更新：2026-07-12 | v0.1.6**
> 项目首页：[https://aik358.github.io/psychopy-studio-harmonyos/](https://aik358.github.io/psychopy-studio-harmonyos/)
> GitCode：[https://gitcode.com/A9iska/psychopy-oh](https://gitcode.com/A9iska/psychopy-oh)
