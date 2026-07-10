# PsychoPy-Oh PsychoJS 浏览器运行 — v8 修复总结 (2026-06-30)

## 根因分析

经过完整审计，发现了**两个致命问题**：

### 问题 1: PIXI.js 缺失 (致命)
`psychojs-2025.2.4.iife.js` 是 PsychoJS 的**库构建（library build）**，不包含渲染引擎。
Window 类的 `_setupPixi()` 方法调用 `autoDetectRenderer()`，这需要全局 `PIXI` 对象。
之前的方案错误地拦截了 WebGL getContext 返回 null，试图让 PIXI 走 Canvas2D 回退——但 PIXI 根本不存在。

**修复**: 下载了 `pixi.js-legacy@5.3.12` (430KB, 从 unpkg CDN)，作为 `<script src="pixi-legacy-5.3.12.min.js">` 在 PsychoJS 之前加载。

### 问题 2: util/visual/core 不在 psychoJS 实例上
官方实验代码写 `const psychoJS = new PsychoJS({...})` 后解构 `const { util, visual, core } = psychoJS;`，
但 PsychoJS 构造函数**没有把命名空间的 util/visual/core 设为实例属性**——这些是 IIFE 导出的懒 getter。

**修复**: 不再从 psychoJS 实例解构。改为在 HTML 中先缓存 `window.__PsychoJSNamespace`，
然后在 experiment.js 顶部注入全局变量 `var util = ns.util; var visual = ns.visual;`。

### 问题 3: constructor.name minified (非当前 blockers)
`psychojs-exporter.js` 的 `f.constructor?.name === "Routine"` 在 SvelteKit 生产构建中被压缩。
**已修复源文件**（改用 duck-typing `f.settings || f.components`），但需要 rebuild 前端才能生效。
当前通过 `patchJSCode` 绕过了这个问题（直接传递官方编译的 JS 文件）。

## v8 方案架构

```
HTML 加载顺序:
  1. pixi-legacy-5.3.12.min.js  → window.PIXI (autoDetectRenderer, Application, etc.)
  2. preloadjs-1.0.0.min.js     → window.createjs (LoadQueue)
  3. psychojs-2025.2.4.iife.js  → var PsychoJS = {core, util, visual, ...}
  4. 归一化脚本                   → window.PsychoJS = ns.core.PsychoJS (构造函数)
                                   → window.__PsychoJSNamespace = ns
  5. experiment.js (patch后)    → 执行实验
```

无 WebGL 拦截。PixiJS-legacy 自动检测环境，如果 WebGL 不可用会回退到 Canvas2D。

## 修改的文件

| 文件 | 修改内容 |
|------|---------|
| `electron/src/psychojs-browser/index.cjs` | 完全重写: 添加 PIXI, 修复 util/visual 注入, 简化 HTML |
| `electron/src/psychojs-browser/lib/pixi-legacy-5.3.12.min.js` | ★ 新增: 从 unpkg 下载 |
| `src/lib/utils/psychojs-exporter.js` | 已修 constructor.name → duck-typing (需 rebuild) |

## 待验证

1. 重启 App，点 Browser → Run experiment
2. 浏览器应显示: `Loading PIXI...` → `PIXI loaded: v5.3.12` → `PreloadJS: OK` → `PsychoJS constructor ready` → `Starting experiment...`
3. 如果 PIXI Canvas2D 或 WebGL 渲染正常，实验的视觉刺激应出现
4. 如果依然黑屏，按 F12 看 `_status` 条的最后一条文字和 Console 错误

## 调试提示

- 绿色状态条 (`#_status`) 显示加载进度
- 红色错误条 (`#_error`) 显示 JS 错误
- 浏览器 Console 有 `[status]` 前缀的日志
- 可以在 `experiment.js` 开头临时加 `document.title = "WORKING"` 验证新代码是否被加载
