# 浏览器实验运行修复（v0.1.4）

## 问题

鸿蒙版 PsychoPy (E:\psychopy-oh-v0.1.3) 从 Builder 点 "Run experiment" 时：
1. 原方案 `loadFile(htmlFile)` 在当前窗口打开实验 → **卡死**
2. 系统浏览器打开白屏 → 从 CDN 加载 PsychoJS 失败（ReferenceError: PsychoJS is not defined）
3. 加的 loading 动画导致页面不像原生实验

## 改动（v2，2026-06-29 14:14）

### `psychojs-browser/index.cjs`

**方案**：起本地 HTTP server → `shell.openExternal()` → 系统浏览器打开

- `loadPsychoJSSource()`：从本地 `psychojs-2025.2.4.iife.js` 读取 IIFE，内联到 HTML 页面（不依赖 CDN）
- `generateRunnerHTML()`：生成极简 HTML，无 loading/无额外 UI，只做两件事：
  1. `<script>` 内联 `var PsychoJS` IIFE
  2. `<script src="experiment.js">` 加载实验代码
- `startServer()`：写文件 → 起 Express HTTP server → `shell.openExternal()`
- `stopServer(address)`：关 server 删临时文件

### `index.cjs`（未变）

- `browserRun` → 调 `startServer` → 返回 URL
- `browserStop` → 调 `stopServer` → 关闭 + 清理

## 数据流

```
Builder → "Run experiment" → runJS()
  → python.psychojs.browserRun(jsCode, expName)
    → startServer()
      1. 写 experiment.js 到 %TEMP%/psychopy-oh-psychojs/<name>_<id>/
      2. 读本地 psychojs-2025.2.4.iife.js
      3. 写 index.html（PsychoJS 内联 + experiment.js 引用）
      4. Express HTTP server 127.0.0.1:92xx
      5. shell.openExternal(url)
      → 系统浏览器打开 ✅ 无卡顿
      → PsychoJS 已定义 ✅ 无 ReferenceError
      → 页面是原生实验 ✅ 无额外 UI
```

## 文件

| 文件 | 说明 |
|------|------|
| `electron/src/psychojs-browser/index.cjs` | 浏览器运行器（核心） |
| `electron/src/psychojs-browser/lib/psychojs-2025.2.4.iife.js` | PsychoJS IIFE 库文件 |
| `electron/src/index.cjs` | 主进程 IPC 注册 |
| `extra/browser/install-100-font.sh` | 中文字体修复（可选） |
