# PsychoPy Studio — 鸿蒙移植版

[English](./README.md) | [项目首页](https://aik358.github.io/psychopy-studio-harmonyos/)

## 项目简介

**PsychoPy Studio** 是一款开源的心理学/神经科学实验设计工具。本项目将其移植到 **HarmonyOS（鸿蒙）** 平台，通过 Electron-on-HarmonyOS 运行时，将 PsychoPy 的 Builder、Coder、Runner 打包为原生鸿蒙 HAP。

> **最新版: 2026.1.2** — 请切换到 `2026.1.2` 分支。下载后需在 DevEco Studio 中配置自动签名。

## 2026.1.2 更新内容 (2026-07-20)

### 核心：实验管线全链路贯通

从 Builder 编写实验 → 编译输出 → 浏览器运行，**全部打通**。

| 里程碑 | 状态 |
|--------|------|
| Python 3.12.8 liaison（WebSocket JSON-RPC） | ✅ 稳定运行 |
| `psychopy-lib` 2026.1.2 完整导入 | ✅ |
| Builder 组件面板（35个组件） | ✅ |
| `writeScript`（输出 .py / .js 文件） | ✅ |
| Run-in-Browser（系统浏览器运行实验） | ✅ 受试者对话框、刺激呈现均正常 |
| 自动检测 + pip 安装缺失依赖 | ✅ 一键安装 13 个核心包 |
| 外部链接打开（首页、文档、Pavlovia） | ✅ 多级回退（shell → NAPI → aa start） |
| 桌面/文档文件读写 | ✅ `requestDirectoryPermission()` |
| Python 终端 + 诊断 | ✅ |

### 架构图 (2026.1.2)

```
┌──────────────────────────────────────────────────┐
│                   鸿蒙设备                          │
│  ┌──────────────────────────────────────────────┐ │
│  │            ArkUI → Electron-OH               │ │
│  │  ┌────────────────────────────────────────┐  │ │
│  │  │  harmony-python.js（主进程）            │  │ │
│  │  │  ┌──────────────────────────────────┐  │  │ │
│  │  │  │  liaison_shim.py（WebSocket）    │  │  │ │
│  │  │  │  psychopy-lib 2026.1.2           │  │  │ │
│  │  │  │  PsychoJS HTTP 服务器            │  │  │ │
│  │  │  └──────────────────────────────────┘  │  │ │
│  │  │  SvelteKit 前端（Builder/Coder）       │  │ │
│  │  │  Express :8003 静态服务                │  │ │
│  │  └────────────────────────────────────────┘  │ │
│  │                                               │ │
│  │  系统 Python 3.12.8（HNP）                     │ │
│  │  numpy / scipy / matplotlib / pandas / ...     │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 关键技术创新

- **ESM 严格模式**：实验以 `<script type="module">` 在浏览器运行。动态变量扫描器自动声明所有 PsychoPy 隐式全局变量。
- **Python f-string 转换修复**：`_fixGeneratedJS` 后处理 Python→JS 输出，修复 `f'{randint(...)}'`、`None`/`False`/`True`、`u'%'` 格式化残留。
- **设备 IP HTTP 服务**：鸿蒙沙箱限制系统浏览器无法访问 `127.0.0.1`，HTTP 服务器绑定 `0.0.0.0` 并通过设备 WiFi IP 打开。
- **IIFE/ESM 双库冲突消除**：删除 IIFE 库避免与 ESM 模块导入产生两个 PsychoJS 单例冲突。
- **对话框 CSS 注入**：`_psychojsDialogCSS` 为 PsychoJS A11yDialog 提供完整样式（受试者信息对话框）。
- **资源文件自动复制**：`_copyExperimentResources` 自动将 .xlsx 条件文件从实验目录复制到 HTTP 输出目录。
- **打开外部链接多级回退**：`shell.openExternal` → NAPI 适配器 → `aa start` 系统命令 → 剪贴板。

## 已知问题

| 问题 | 状态 | 计划 |
|------|------|------|
| `libsndfile.so` 缺失 | ⚠️ 软失败 | camera/mic 组件跳过并打 warning。需将 .so 打入 `libs/arm64-v8a/` |
| 双 liaison 进程导致终端日志重复 | ⚠️ 不影响功能 | `_doStartLiaison` 已有幂等守卫 |
| Pavlovia OAuth / 问卷 | ⏳ 待完成 | `index.cjs` 缺少 `/api/token/*` 路由 |
| 原生 pyglet 窗口（GPU/X11） | ❌ 不可用 | 使用 PsychoJS 浏览器路线 |

## 构建步骤

### 环境要求

- DevEco Studio 5.0+（HarmonyOS SDK API 15+）
- Node.js 18.x+
- 鸿蒙设备（ARM64 aarch64）

### 快速构建

```bash
git checkout 2026.1.2
ohpm install
cd web_engine/src/main/resources/resfile/resources/app
npm install
npx vite build
cd ../../../../../../../..
# 在 DevEco Studio 中点击 Build → Build HAP
# 或命令行：
hvigorw assembleHap --no-daemon
```

## 设备要求

- Python 3.12.8 通过 HNP 安装于 `/data/service/hnp/python.org/python_3.12/bin/python3`
- 首次启动自动通过 pip 安装缺失包
- 建议安装 HarmonyBrew 获取系统库（`libsndfile`）

## 分支

| 分支 | 说明 |
|------|------|
| `2026.1.2` | **最新** — 完整实验管线、一键安装、ESM 支持 |
| `v0.1.6` | 此前稳定版 — Python 后端首次激活 |
| `main` | 落地页 + 文档 |

## 许可

- 项目模板：Apache 2.0
- PsychoPy：[GPL v3](https://github.com/psychopy/psychopy/blob/master/LICENSE)

---

> **最后更新：2026-07-20 | 2026.1.2**
> GitCode：[https://gitcode.com/A9iska/psychopy-oh](https://gitcode.com/A9iska/psychopy-oh)
