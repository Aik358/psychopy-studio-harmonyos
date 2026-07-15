# PsychoPy Studio for HarmonyOS (Electron-OH)

PsychoPy Studio 移植到鸿蒙 HarmonyOS PC，基于 Electron-OH (Chromium 132 + 鸿蒙适配)。

## 架构

```
SvelteKit 前端 (contextBridge IPC)
  → Electron-OH 主进程 (WebSocket JSON-RPC Liaison)
    → Python 运行时 (system Python3)
      → psychopy-lib 实验引擎
```

## 版本: v0.1.5 (2026-07-11)

### v0.1.5 更新
- **PsychoJS Browser Runner**: 实验可通过系统浏览器运行（IIFE 桥接 + 本地库文件）
- **跳过 DlgFromDict**: 本地浏览器模式自动跳过对话框，直接运行实验
- **本地化依赖**: jQuery 3.6.0 / jQuery UI 1.12.1 / PreloadJS / PIXI.js 全部本地化，无需 CDN
- **错误捕获**: HTML 模板添加 error/unhandledrejection 事件监听，出错时页面显示红色错误信息
- **Vite build 重建**: 前端构建成功，dist 目录更新

### v0.1.4 更新 (2026-06-25)
- Electron-OH 路线确立，HAP 打包流程验证通过
- SvelteKit 前端适配鸿蒙
- Python Liaison 通信层 (WebSocket JSON-RPC)

### v0.1.3 更新 (2026-06-24)
- ArkTS 原生方案废弃，回归 Electron-OH
- 完整架构分析和移植路线图设计

## 关键目录

| 目录 | 用途 |
|------|------|
| `electron/src/` | Electron-OH 主进程 (main.js, preload.js, python/) |
| `electron/src/psychojs-browser/` | PsychoJS 浏览器运行器 (index.cjs + lib/) |
| `src/` | SvelteKit 前端源码 |
| `dist/` | Vite 构建输出 |
| `python/` | Python 运行时模块 (liaison, venv, shell, script, psychojs) |

## PsychoJS Browser Runner

`electron/src/psychojs-browser/index.cjs` 实现了实验在系统浏览器中运行的功能：

1. 前端 `runJS()` 调用 `exportExperimentToJS()` 生成 experiment.js
2. IPC `python.psychojs.browserRun` 将 JS 代码发送到主进程
3. 主进程写入临时目录（HTML + JS + 库文件），启动 Express HTTP server
4. `shell.openExternal` 打开系统浏览器访问 `http://127.0.0.1:PORT/`

### IIFE 桥接
PsychoJS IIFE 库导出命名空间对象 `{core, data, hardware, sound, util, visual}`，桥接脚本提取全局变量：
```js
window.PsychoJS = ns.core.PsychoJS;  // 构造函数
window.util = ns.util;
window.Scheduler = ns.util.Scheduler;
window.visual = ns.visual;
// ...
```

### 生成代码风格
`psychojs-exporter.js` 生成 legacy-browsers 风格代码（无 import，全全局变量），使用 Scheduler 驱动帧循环。

## 开发

```bash
# 安装依赖
npm install

# 构建前端
npx vite build

# 启动 (鸿蒙)
# 在 DevEco Studio 中打包 HAP
```

## 许可证
GPL-3.0 (PsychoPy upstream)

## 仓库
- AtomGit: https://atomgit.com/A9iska/psychopy-oh
- GitCode: https://gitcode.com/A9iska/psychopy-oh
