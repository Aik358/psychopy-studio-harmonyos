# HarmonyOS ARM64 本机构建 & 问题解决攻略

## 概述

本指南记录了在 **HarmonyOS ARM64（aarch64）** 设备上成功自构建 PsychoPy Studio 的全流程经验。涵盖从环境搭建、前端编译、代码签名到常见问题解决的完整攻略。

**适用设备**：HarmonyOS 5.0+ / HongMeng Kernel 1.12+，arm64 架构  
**最后更新**：2026-06-25

---

## 目录

1. [环境搭建](#1-环境搭建)
2. [前端构建（Vite on HarmonyOS）](#2-前端构建vite-on-harmonyos)
3. [签名 Native Binding](#3-签名-native-binding)
4. [开发工作流：每改必重编](#4-开发工作流每改必重编)
5. [Python 后端暂替方案](#5-python-后端暂替方案)
6. [常见问题](#6-常见问题)
7. [TODO：连接后端时需恢复的改动](#7-todo连接后端时需恢复的改动)

---

## 1. 环境搭建

### 1.1 工具链

| 工具 | 路径 | 说明 |
|------|------|------|
| Node.js | `/storage/Users/currentUser/.harmonybrew/Cellar/node/26.3.1/bin/node` | 通过 harmonybrew 安装 |
| npm CLI | `/storage/Users/currentUser/.harmonybrew/Cellar/node/26.3.1/lib/node_modules/npm/bin/npm-cli.js` | 绕过 `npm` 二进制崩溃 |
| binary-sign-tool | `/storage/Users/currentUser/.harmonybrew/bin/binary-sign-tool` | 用于签名 `.node` 原生模块 |
| hvigor | `/data/app/hvigor.org/hvigor_1.0.0/bin/hvigorw.js` | 鸿蒙 HAP 构建工具 |
| SDK | harmonybrew ohos-sdk 26.0.0.18 | HarmonyOS SDK |

### 1.2 Node.js 说明

**不要使用** `/data/service/hnp/bin/node`（v24.13.0）—— 它有 `__errno_location` 断言崩溃 bug。

**必须使用** harmonybrew 编译的 Node.js v26.3.1：
```bash
export NODE="/storage/Users/currentUser/.harmonybrew/Cellar/node/26.3.1/bin/node"
export NPM_CLI="/storage/Users/currentUser/.harmonybrew/Cellar/node/26.3.1/lib/node_modules/npm/bin/npm-cli.js"
```

这个版本通过 `--dest-os=openharmony --partly-static` 编译参数适配了 HarmonyOS。

> **`npm` 二进制文件在 HarmonyOS 上会崩溃**（同样是 `__errno_location` 问题），必须用 `node npm-cli.js` 替代。

---

## 2. 前端构建（Vite on HarmonyOS）

### 2.1 完整构建命令

```bash
cd web_engine/src/main/resources/resfile/resources/app

# 1. 移除 package.json 的 os 限制
$NODE -e "
const pkg = require('./package.json');
delete pkg.os;
delete pkg.optionalDependencies;
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# 2. 安装依赖
$NODE "$NPM_CLI" install

# 3. 签名 rolldown binding（见第3节）

# 4. 替换 lightningcss 为 WASM（见第3节）

# 5. 构建前端
$NODE \
  --permission \
  --allow-addons \
  --allow-fs-read=* \
  --allow-fs-write=* \
  --allow-child-process \
  --allow-worker \
  ./node_modules/.bin/vite build
```

### 2.2 `node --permission` 参数说明

HarmonyOS 的 Node.js 启用了实验性权限模型，需要显式授权：

| 参数 | 用途 |
|------|------|
| `--permission` | 启用权限模型 |
| `--allow-addons` | 允许加载原生 `.node` addon（已签名的 rolldown binding） |
| `--allow-fs-read=*` | 允许读取所有文件 |
| `--allow-fs-write=*` | 允许写入文件 |
| `--allow-child-process` | 允许子进程（CSS 等处理需要） |
| `--allow-worker` | 允许 Worker 线程（SvelteKit 编译需要） |

### 2.3 构建产出

```
✓ 668 modules transformed.
✓ built in 10.50s
Wrote site to "./dist"
✔ done
```

产出目录：`dist/`（约 9.7MB）

---

## 3. 签名 Native Binding

### 3.1 为什么需要签名

HarmonyOS 的安全框架要求动态加载的共享库（`dlopen`）必须有代码签名。未经签名的 `.node` 文件会报 `ERR_DLOPEN_FAILED` / `Permission denied`。

### 3.2 签名 rolldown

```bash
SIGN_TOOL="/storage/Users/currentUser/.harmonybrew/bin/binary-sign-tool"
BINDING="node_modules/@rolldown/binding-openharmony-arm64/rolldown-binding.openharmony-arm64.node"

$SIGN_TOOL sign \
  -selfSign 1 \
  -inFile "$BINDING" \
  -outFile "$BINDING.signed" \
  -signAlg SHA256withECDSA

mv "$BINDING" "$BINDING.unsigned"
cp "$BINDING.signed" "$BINDING"
chmod +x "$BINDING"
```

> `-selfSign 1` 使用自签名模式，不需要正式的开发者证书。

### 3.3 lightningcss WASM 回退

`lightningcss` 原生 binding 依赖 `libgcc_s.so.1`，而 HarmonyOS 使用 clang/LLVM 不包含此库。解决方案是替换为 WASM 版本：

```bash
# 安装 lightningcss-wasm
$NODE -e "
const https = require('https'), fs = require('fs');
https.get('https://registry.npmjs.org/lightningcss-wasm/-/lightningcss-wasm-1.32.0.tgz', (r) => {
  (r.statusCode === 302 ? https.get(r.headers.location) : r)
    .pipe(fs.createWriteStream('lightningcss-wasm.tgz'))
    .on('finish', () => console.log('✅ 下载完成'));
});
"
mkdir -p node_modules/lightningcss-wasm
tar xzf lightningcss-wasm.tgz -C node_modules/lightningcss-wasm --strip-components=1

# 替换 lightningcss 入口为 WASM
cp node_modules/lightningcss/node/index.js node_modules/lightningcss/node/index.js.bak
cat > node_modules/lightningcss/node/index.js << 'EOF'
const wasm = require('lightningcss-wasm');
module.exports = wasm;
EOF
```

---

## 4. 开发工作流：每改必重编

每次修改前端源代码后，**必须重新构建并同步到 HAP**，否则改动不会生效。

### 4.1 完整流程

```bash
# 修改源代码（如 Icon.svelte、profiles.svelte.js 等）
vim src/lib/utils/icons/Icon.svelte

# 1. 重新构建前端
cd web_engine/src/main/resources/resfile/resources/app
$NODE --permission --allow-addons --allow-fs-read=* --allow-fs-write=* --allow-child-process --allow-worker ./node_modules/.bin/vite build

# 2. 回到项目根目录
cd ../../../../../../../..

# 3. 清理并重新构建 web_engine HAR（打包新的 dist/）
hvigorw clean --no-daemon
hvigorw --mode module -p module=web_engine@default -p product=default -p buildMode=debug assembleHar --no-daemon

# 4. 构建 electron HAP
hvigorw --mode module -p module=electron@default -p product=default -p buildMode=debug assembleHap --no-daemon

# 5. 安装到设备（通过 DevEco Studio 的 Run 或 hdc）
```

### 4.2 需要重建的场景

| 修改内容 | 需要重建前端？ | 需要重建 HAP？ |
|----------|:------------:|:------------:|
| `Icon.svelte` / `*.svelte` | ✅ | ✅ |
| `profiles.svelte.js` / `*.js` | ✅ | ✅ |
| `electron/src/index.cjs` | ❌ | ✅ |
| `build-profile.json5` | ❌ | ✅ |
| `module.json5` | ❌ | ✅ |
| 静态资源（`static/`） | ✅ | ✅ |
| `package.json` 依赖 | 需 `npm install` | ✅ |

### 4.3 增量构建

如果只改了 `electron/src/index.cjs`（主进程代码），可以跳过前端构建：

```bash
hvigorw --mode module -p module=electron@default -p product=default -p buildMode=debug assembleHap --no-daemon
```

如果改了前端代码，必须走完整流程。

---

## 5. Python 后端暂替方案

当前 Python 后端尚未适配 HarmonyOS，用 IPC stub 跳过：

### 5.1 涉及的文件

- `web_engine/src/main/resources/resfile/resources/app/electron/src/index.cjs`（27 个 `ipcMain.handle()` 注册）
- `web_engine/src/main/resources/resfile/resources/app/src/lib/experiment/profiles.svelte.js`（`pending.components` 初始化）

### 5.2 当前 stub 行为

| IPC 通道 | 行为 |
|----------|------|
| `python.uv.exists` | 返回 `true`（假装已安装） |
| `python.uv.install` | 返回 `Promise.resolve(true)` |
| `python.venv.setup` | 返回 `Promise.resolve(true)` |
| `python.liaison.send` | 抛出错误（使前端使用本地 fallback） |
| `python.liaison.ready` | 返回永不解析的 Promise（阻止 Python 加载） |

### 5.3 Components 加载机制

Components 数据加载流程：
1. 初始加载 `fallbacks/components.json`（本地静态数据）→ 面板立即显示
2. 如果 Python 连接成功 → 用 Python 获取的数据覆盖本地数据
3. Python 不可用时 → `pending.components` 初始化为 `Promise.resolve()`，保持本地数据

---

## 6. 常见问题

### 6.1 Node.js 崩溃：`Check failed: 12 == (*__errno_location())`

**原因**：HarmonyOS HongMeng 内核的 thread-local errno 实现与 glibc 不兼容。

**解决**：使用 harmonybrew 编译的 Node.js v26.3.1（`--dest-os=openharmony --partly-static` 编译）。

### 6.2 npm install 失败：`EBADPLATFORM`

**原因**：npm 检测到 `openharmony` 系统，但包的 `"os"` 字段只允许 `darwin/linux/win32`。

**解决**：删除 `package.json` 中的 `"os"` 字段和 `"optionalDependencies"`。

### 6.3 dlopen 失败：`Permission denied`

**原因**：HarmonyOS 安全策略阻止加载未签名的 ELF 共享库。

**解决**：用 `binary-sign-tool sign -selfSign 1` 签名 `.node` 文件。

### 6.4 dlopen 失败：`Error loading shared library libgcc_s.so.1`

**原因**：HarmonyOS 使用 clang/LLVM，不包含 GCC 运行时库。

**解决**：将对应 native binding 替换为 WASM 版本（如 `lightningcss-wasm`）。

### 6.5 SVG 图标不显示或按钮空白

**症状**：
- 工具栏和组件面板的 SVG 图标不显示
- 组件列表只显示空白的按钮占位
- 刷新按钮等 UI 元素缺失

**原因**：有两种 SVG 图标加载方式：

1. **外部 SVG 文件**（工具栏图标）：通过 `<use href="/icons/btn-add.svg">` 加载，CSS 变量（`var(--outline)`）不从 HTML 页面继承。
2. **内联 SVG XML**（组件图标）：存储在 `components.json` 中的 `<svg>...</svg>` 字符串，之前被漏处理，渲染为空白。

**解决**：修改 `Icon.svelte`，用 `fetch()` + 内联渲染处理两种情况的 SVG：

```svelte
let isInlineSvg = $derived(String(src).trim().startsWith('<'));

$effect(() => {
    if (!String(src).match(/.*\.(png|jpg|jpeg)/g)) {
        if (isInlineSvg) {
            // 内联 SVG XML - 直接使用
            svgContent = src;
        } else if (String(src).match(/.*\.svg/g) && url) {
            // 外部 SVG 文件 - fetch 后内联
            fetch(url).then(r => r.text()).then(text => {
                svgContent = text;
            }).catch(() => { svgError = true; });
        }
    }
});
```

关键：内联 SVG 以 `<` 开头时直接赋值，`fetch()` 只用于外部 `.svg` 文件。

**原因**：HarmonyOS Electron 中 SVG 通过 `<use href={url}>` 加载时，CSS 变量（`var(--outline)` 等）不从 HTML 页面继承。

**解决**：修改 `Icon.svelte`，用 `fetch()` 获取 SVG 内容后内联渲染（`{@html svgContent}`），CSS 变量可正常继承。

```svelte
<!-- 修改前 -->
<use href={url} />

<!-- 修改后 -->
<span class=icon style:width={size} style:height={size}>
    {@html svgContent}
</span>
```

### 6.6 Components 面板一直 "Loading..." 或 "Failed to load"

**原因**：`pending.components` 初始化为 `Promise.withResolvers().promise`（永不解析的 Promise）。Python 连接失败后，没有替换为已解析的 Promise，面板永远在等待。

同时 `python.liaison.send` 返回字符串 `"{}"` 导致 `Object.assign` 出错。

**解决**：
1. `profiles.svelte.js`：`pending.components` 改为 `Promise.resolve()`
2. `index.cjs`：`python.liaison.send` 改为抛出错误，使前端使用本地 fallback
3. `index.cjs`：`python.liaison.ready` 改为 `new Promise(() => {})`（永不解析），阻止 Python 加载流程

```js
// profiles.svelte.js
components: Promise.resolve(),  // TODO: revert when Python backend is ready

// index.cjs
ipcMain.handle("python.liaison.send", () => { throw new Error(...); });
ipcMain.handle("python.liaison.ready", () => new Promise(() => {})); // TODO: revert
```

---

## 7. TODO：连接后端时需恢复的改动

当 Python/CPython 后端准备就绪时，需要恢复以下改动：

### 7.1 `electron/src/index.cjs`

```js
// 1. 移除 27 个 ipcMain.handle() stubs（约第36-62行）
// 2. 取消注释导入：
//    const { handlers: pythonHandlers } = (await import("./python/index.js"));
// 3. 取消注释：
//    python: pythonHandlers,
// 4. 恢复：
//    ipcMain.handle("python.liaison.ready", () => Promise.resolve());
//    ipcMain.handle("python.liaison.send", () => Promise.resolve("{}"));
```

### 7.2 `src/lib/experiment/profiles.svelte.js`

```js
// 恢复为：
components: Promise.withResolvers().promise,
loops: Promise.withResolvers().promise,
devices: Promise.withResolvers().promise,
preferences: Promise.withResolvers().promise
```

### 7.3 `src/lib/utils/icons/Icon.svelte`

```svelte
// 如果上游修复了 CSS 变量问题，可以恢复为 <use href={url}>
```

### 7.4 `web_engine/.../resources/app/package.json`

```json
// 恢复 os 字段和 optionalDependencies
"os": ["darwin", "linux", "win32"],
"optionalDependencies": {
    "@rollup/rollup-linux-x64-gnu": "*"
}
```

---

## 附录：文件位置速查

| 文件 | 路径 |
|------|------|
| 图标组件 | `web_engine/.../resources/app/src/lib/utils/icons/Icon.svelte` |
| 组件加载 | `web_engine/.../resources/app/src/lib/experiment/profiles.svelte.js` |
| 主进程 | `web_engine/.../resources/app/electron/src/index.cjs` |
| Python IPC | `web_engine/.../resources/app/electron/src/python/index.js` |
| 构建配置 | `build-profile.json5` |
| HAP 产出 | `electron/build/default/outputs/default/electron-default-signed.hap` |
| 前端构建产出 | `web_engine/.../resources/app/dist/` |
| 前端源码 | `web_engine/.../resources/app/src/` |
