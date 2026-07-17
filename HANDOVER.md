# PsychoPy-Oh v0.1.6 升级 + 鸿蒙适配 (2026-07-14)

## 背景
- 项目从 v0.1.2 升级到 v0.1.6（gitcode.com/A9iska/psychopy-oh）
- 目标：在 HarmonyOS 上构建 HAP 并运行
- 目录改名：`ohos_electron_hap-main_Psychopy_v0.1` → `ohos_electron_hap-main_Psychopy_v0.1.6`

## 环境关键事实
- **鸿蒙本机**：HarmonyOS HongMeng Kernel 1.12.0 aarch64，hmdfs 文件系统
- **DevEco Studio 本机版本较老**：只识别 `6.1.0(23)` 格式的 SDK 版本字符串，不认 `26.0.0`
- **harmonybrew ohos-sdk**：26.0.0.18 (API 26)，装在 `/storage/Users/currentUser/.harmonybrew/Cellar/ohos-sdk/26.0.0.18`
- **本机 DevEco 默认工程**：`/storage/Users/currentUser/Documents/DevEcoStudioProjects/MyApplication`，用 `"6.1.0(23)"` 格式
- **Node.js**：系统 v24.13.0 会崩溃（Check failed: 12 == (*__errno_location())），必须用 harmonybrew v26.3.1
- **hmdfs 限制**：`.node` 原生库无法 dlopen（ERR_DLOPEN_FAILED / Permission denied）

## 已完成

### 1. SDK 版本适配
`build-profile.json5` 改为：
```json5
"compatibleSdkVersion": "6.1.0(23)",
"targetSdkVersion": "6.1.0(23)"
// 删除 compatibleSdkVersionStage，不设 compileSdkVersion
```
**注意**：Windows DevEco 新版本可能用 `26.0.0` 格式，鸿蒙老 DevEco 用 `6.1.0(23)`。当前配置适配鸿蒙本机。

### 2. oh_modules 软链修复
项目目录改名后，8 个 oh_modules 软链失效（指向旧 `Psychopy_v0.1/` 路径）。已批量重指到 `Psychopy_v0.1.6/`：
- `electron/oh_modules/web_engine`
- `web_engine/oh_modules/{inversify,reflect-metadata,libadapter.so}`
- `oh_modules/.ohpm/oh_modules/{inversify,reflect-metadata,@ohos/hypium}`
- `oh_modules/@ohos/hypium`

### 3. Vite 前端构建成功
- `web_engine/src/main/resources/resfile/resources/app/` 下 `vite build` 成功
- 输出 `dist/`，670 SSR + 660 client 模块，~18s
- **关键 workaround**：rollup 原生绑定在 hmdfs 上 dlopen 失败，需用 `@rollup/wasm-node` 替换：
  ```bash
  rm -rf node_modules/rollup && ln -sf @rollup/wasm-node node_modules/rollup
  ```
  每次 `npm install` 后都要重新执行这一步。

### 4. Build 成功
hvigor assembleHap 构建成功，但运行时报错（见下）。

## 当前问题：闪退（SIGTRAP-ICU）— 已修复 V2（使用系统 ICU 数据）

### 崩溃日志
```
ERROR:icu_util.cc(228)] Invalid file descriptor to ICU data received.
```

### 第一次修复尝试（失败）
复制 `resources/resfile/icudtl.dat` 到 cache 目录：
```
Failed to copy icudtl.dat: {"code":13900002}
```
**根因**：HAP 内 `resfile/` 的内容在 zip 归档中，不能通过常规文件 IO 访问（error 13900002 = 文件不存在）。

### 第二次修复（当前方案）
改用系统 ICU 数据文件 `/system/usr/icu/icudt74l.dat`（32MB，ICU 版本 74 小端序，与 `icudtl.dat` 同版本）：
```typescript
let sysIcu = '/system/usr/icu/icudt74l.dat';
let dst = getContext().cacheDir + '/icudtl.dat';
fs.copyFileSync(sysIcu, dst);
vec_args.push('--icu-data-dir=' + getContext().cacheDir);
```

### 崩溃日志
```
Reason:Signal:SIGTRAP(TRAP_BRKPT)@0x0000005c66f55ac8
[0714/151118.262871:ERROR:icu_util.cc(228)] Invalid file descriptor to ICU data received.
```

### 根因
`libelectron.so` 启动时 Chromium 层加载 `icudtl.dat`（ICU 国际化数据，10MB）。HAP 内文件在 hmdfs 上，文件描述符无效，导致 `SIGTRAP` 崩溃。**崩溃发生在 Electron 加载任何 JS 代码之前**，所以 `main.js` 和 `electron/src/index.cjs` 都还没机会执行。

### 修复
`web_engine/src/main/ets/components/WebWindow.ets` 的 `buildArgs()` 方法：

1. 把 `resources/resfile/icudtl.dat` 复制到 `cacheDir/icudtl.dat`（常规文件系统）
2. 传 `--icu-data-dir=<cacheDir>` 参数让 Electron 从 cache 加载 ICU 数据

### 待验证
1. 重新 build HAP（DevEco Studio → Sync → Build → Deploy）
2. 如果还闪退，看 Logcat 里 `icudtl.dat` 复制是否成功（搜索 `Copied icudtl.dat`）

### 根因
新版 `v0.1.6` 的 commit `23bd7ae` 删除了 `resources/app/main.js`，但 **HarmonyOS Electron 运行时默认找 `main.js` 作为入口文件**。没有 `main.js`，`libelectron.so` 启动不知道加载哪个脚本，`WebWindow` XComponent 表面空白。

### 修复
创建 `web_engine/src/main/resources/resfile/resources/app/main.js`，内容：
```javascript
// HarmonyOS Electron 入口 — 加载实际主进程
require('./electron/src/index.cjs');
```
`package.json` 的 `"main": "electron/src/index.cjs"` 字段作为备份，但 HarmonyOS 运行时首选根 `main.js`。

### 修复 2：--bundle-installation-dir 路径修正
`WebWindow.ets` 的 `buildArgs()` 方法：
```typescript
// 改前：--bundle-installation-dir=<resourceDir>  (即 resources/)
// 改后：--bundle-installation-dir=<resourceDir>/resfile  (即 resources/resfile/)
```
因为 HAP 内 Electron app 的实际路径是 `resources/resfile/resources/app/`，但 Electron 运行时按 `<dir>/resources/app/` 查找。旧版 `resourceDir` 少了 `resfile/` 一级，导致 Electron 找不到入口。

### 待验证
1. 重新 build HAP（DevEco Studio → Sync → Build → Deploy）
2. 如果仍白屏，检查 DevEco Studio 的 Logcat 输出，看 `libadapter.so` 或 `libelectron.so` 是否有加载错误

## 旧问题：Metadata validation failed（根因已定位）

运行时报：
```
07/14, 10:27:52 AM: Metadata validation failed. Please try re-sync and deploy again.
07/14, 11:00:42 AM: Metadata validation failed. Please try re-sync and deploy again.
```

### 根因
DevEco Studio deploy 时校验 hap 包 metadata 里的签名信息是否与当前登陆账号的 client_id 匹对。

**关键事实**：
- DevEco Studio 当前打开的工程 = `/storage/Users/currentUser/Desktop/ohos_electron_hap-main_Psychopy_v0.1.6`（DevEco 工程名 `Psyoh_v0.1.2_HarmonyOS_Local_Build_Test`，来自 `.bitfun/project.json`）
- 当前 `build-profile.json5` 的 `signingConfigs.material` 指向 `/storage/Users/currentUser/Documents/ohos/config/default_Psyoh_v0.1.2_...{cer,p12,p7b}` —— 这是**外部导入的旧证书**（07-14 10:23 时间戳，从别处拷来的），不是 DevEco Studio 用当前账号在本机生成的
- DevEco Studio 默认证书目录 `/storage/Users/currentUser/appdata/el2/base/com.huawei.devecostudio/files/ohos/config/` **是空的** —— 当前登陆账号下从未在本机生成过调试证书
- 重新登陆华为账号仍报同一错 → 证书与当前账号 client_id 不绑定，metadata 校验失败

### 已尝试无效的方案
- 删除 `module.json5` 里的 `metadata: [{"name":"client_id","value":""}]` → 仍报同一错（已还原）
- 重新登陆华为账号 → 仍报同一错

### 待执行的修复（用户在 DevEco Studio UI 里操作）
1. File → Project Structure → Signing Configs
2. 删除当前 `default` signingConfig
3. 勾选 **「Automatically generate signature」**（自动签名）
4. DevEco 用当前账号在本机 `appdata/.../ohos/config/` 自动生成新证书，重写 `build-profile.json5` 的 `signingConfigs.material`
5. Apply → Sync → Deploy

### hvigor report 里两个 log 级错误（非根因，但记一下）
- `failed to load cangjie to dynamically generate schemas: Cannot find module '@ohos/cangjie-build-support/index'`（出现 2 次，log 级，GenerateMetadata task 仍 UP-TO-DATE）
- `Error occurs while handling @Input 'shouldDeduplicateHar': data argument undefined`（log 级）

## 待解决的编译错误（build 时）

虽然 build 最终成功，但 hvigor 编译 ArkTS 时报了 19 个错误、17 个警告：

### 错误分类
| 类别 | 数量 | 说明 |
|------|------|------|
| `Cannot find module 'web_engine'` | 14 | oh_modules 软链问题（已修复软链，待重新 build 验证） |
| `This member cannot have an 'override' modifier` | 2 | BrowserAbility/StatelessAbility 代码问题 |
| `'WebSubWindow()' does not meet UI component syntax` | 4 | ArkTS UI 组件签名问题 |

### 关键代码位置
- `electron/src/main/ets/pages/SubWindow.ets` — `WebSubWindow()` UI 组件语法错误
- `electron/src/main/ets/entryability/BrowserAbility.ets:66` — override 修饰符错误
- `electron/src/main/ets/entryability/StatelessAbility.ets:71` — override 修饰符错误

## 多窗口 / 悬浮窗调研结论

用户问能否借鉴 openharmony-sig/electron 的悬浮窗支持来解决多窗口"反复刷新"问题。

### openharmony-sig/electron 的方案
- `BrowserWindow` 构造参数加 `windowInfo.type`：`mainWindow` / `subWindow` / `floatWindow`
- 悬浮窗走 `window.createWindow({windowType: window.WindowType.TYPE_FLOAT})`
- 需申请 `ohos.permission.SYSTEM_FLOAT_WINDOW`（受控开放权限）
- **限制**：全局悬浮窗仅支持 PC/2in1 设备

### 本项目当前实现
- `WebBaseAbility.createSubWindow(name)` → `windowStage.createSubWindow(name)`（共享 windowStage 的子窗口）
- `AppWindowAdapter` 用 `setSupportedWindowModes([FLOATING])` 实现伪悬浮
- 未申请 `SYSTEM_FLOAT_WINDOW` 权限
- 未实现真正的 `TYPE_FLOAT` 全局悬浮窗

### 借鉴建议
1. **如果"反复刷新"是子窗口生命周期管理混乱** → 借鉴 openharmony-sig 的 `windowInfo.type` 分层设计
2. **如果需要"主窗口关了，悬浮窗还在"** → 必须用 `TYPE_FLOAT` 真悬浮窗
3. **如果只是多窗口切换卡死** → 问题更可能在 `showWindow` → `showAbility` 链路（`AppWindowAdapter.ets:229-236`），每次 show 都走 Ability 级别的 show，容易触发重载。subWindow 应直接 `window.showWindow()`，不走 Ability 层

**待用户确认**："反复刷新"的具体表现，以及期望的最终效果。

---

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
