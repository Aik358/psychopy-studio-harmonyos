# PsyOH 改动记忆文件（AtomCode 维护日志）

> 用途：上下文被压缩时读此文件可快速连上改动脉络。每行一次改动，含时间戳、文件、根因、改法。
> 项目根：`/storage/Users/currentUser/Desktop/psychopy-oh-v0.1.6/`
> 关键副本同步规则：改 `web_engine/src/main/resources/resfile/resources/app/electron/src/` 下文件后，要同步到 `hap_inspect/`、`electron/build/default/intermediates/...`、`Documents/ohos_electron_hap-main_Psychopy_v0.1.6/` 下所有副本。

---

## [2026-07-15 10:39] — WebSocket 兜底 + Psychopy/Matplotlib 鸿蒙沙箱写权限

### 根因（从 electron 主进程日志诊断）
1. **WebSocket 不可用**：Electron-OH 没有 `globalThis.WebSocket`，也没有 `node:ws` / `ws` 包 → `new WebSocket()` 抛异常 → `_liaisonReady` 永远 false → 所有依赖 liaison 的功能 stub 化。
2. **Psychopy 导入失败**：`preferences.py:154-156` 用 `os.environ['HOME'] + '.psychopy3'` 构造 `userPrefsDir`（**不读 `PSYCHOPY_HOME`**），默认 `~` 即 `/storage/Users/currentUser` 鸿蒙沙箱拒绝写 → `devices.json` PermissionError。
3. **Matplotlib 缓存**：默认写 `~/.config/matplotlib`，沙箱拒绝。

### 改动文件
**`electron/src/harmony-python.js`**（8 副本全同步）：
- 新增 `import net from "net"; import crypto from "crypto";`
- 新增 `MinimalWebSocket` 类（行 26-153，纯 Node 内置模块实现 RFC 6455 client）：
  - `net.createConnection` 做 TCP 握手，`crypto.randomBytes` 生成 `Sec-WebSocket-Key`
  - `_processFrames()` 解 opcode/mask/len，支持 126/127 长度扩展
  - **故意不实现 `addEventListener`**（让 `wsOn()` 检测 `typeof ws.addEventListener === "undefined"` 自动降级到 `.on` 路径）——上一轮"委派到 on"的写法是 Critical bug，`wsOn` wrapper `(evt) => handler(evt.data)` 收字符串 payload 后读 `.data` 得 `undefined` 导致所有命令静默失败
- WebSocket 降级链：`globalThis.WebSocket → node:ws → MinimalWebSocket`
- **删了** `PSYCHOPY_HOME` 和 `MPLCONFIGDIR` env（死代码，Psychopy 不读 `PSYCHOPY_HOME`）

**`electron/src/python/liaison_shim.py`**（7 副本全同步）：
- 在 `os.environ['OPENBLAS_MAIN_FREE'] = '1'` 后、import psychopy 前插入：
  ```python
  _HARMONY_SANDBOX = "/data/storage/el2/base/cache"
  os.makedirs(os.path.join(_HARMONY_SANDBOX, "home"), exist_ok=True)
  os.environ['HOME'] = os.path.join(_HARMONY_SANDBOX, "home")
  os.makedirs(os.path.join(_HARMONY_SANDBOX, "matplotlib"), exist_ok=True)
  os.environ['MPLCONFIGDIR'] = os.path.join(_HARMONY_SANDBOX, "matplotlib")
  ```
- 关键：设 `HOME` 而非 `PSYCHOPY_HOME`，因为 `preferences.py` 只读 `HOME`。
- `os.environ['X']='Y'` 不清父进程传入的 env，shim 在 import psychopy 前设 HOME → 时序正确。

### 验证
- ✅ `node --check` 通过（用 HarmonyBrew node v24.17.0，**绝不能用系统 node v24 会 native crash**）
- ✅ `python3 ast.parse` 通过
- ✅ `vite build` 成功（11.00s，三窗口 index.html 就位）
- ⚠️ Low 未修：`MinimalWebSocket._processFrames` 漏 opcode `0x0`/`0xA` default 分支（websockets 库实际不发，不阻塞）

### 副本同步清单（8 个 JS + 7 个 PY）
psychopy-oh-v0.1.6/：web_engine、hap_inspect、electron/build、根目录 liaison_shim.py
Documents/ohos_electron_hap-main_Psychopy_v0.1.6/：web_engine、electron/build、resources、根目录

---

## 环境备忘
- 系统 `node` v24.13.0 **坏的**（native crash exit 133），用 HarmonyBrew 的：`~/.harmonybrew/Cellar/node@24/24.17.0/bin/node`（见 `harmonybrew-build` skill）
- `ast-grep` 二进制未安装，做 AST 验证时用 `grep` + Python ast.parse + HB node --check 组合
- 项目无 `package.json scripts`，构建直接调 `node_modules/vite/bin/vite.js build`

---

## [2026-07-15 11:33] — 自加左上角 terminal 显示 liaison Python 运行/报错日志

### 根因
1. **行 323-324 监听器时机错**：liaison stdout/stderr 早注册监听但 panel 未创建时 `appendTermOutput` 取 `#term-output` 失败静默丢日志。
2. **行 324 把对象当 textContent**：liaison stderr 推的是 `{error: "string"}` 对象（[11:11] 改的），行 324 `appendTermOutput(data, ...)` 当字符串 → 显示 `[object Object]`。
3. **只监听 stdout/stderr 两通道**：liaison 进程发的 `"uv"` 通道（stdout/stderr 同步）、`"liaison:error"` 通道（RCP error 帧）都没监听 → terminal 丢 liaison 启动/运行/报错日志。

### 改动文件
**`electron/src/preload.js`**（5 副本全同步 + vite build）：
- 新增 `_formatPayload(data)` 工具函数：处理 string / `{error:"..."}` / `{error:{message,traceback}}` / Error / 普通对象 5 种 payload 形式
- 监听器从行 323-324 移到 panel 创建后（toggleTerminalPanel 之后），早注册也没事因为 appendTermOutput 静默返回
- 新增监听 `"uv"` 通道（灰色 subtext0 显示 liaison stdout/stderr）
- 新增监听 `"liaison:error"` 通道（红色显示 RCP error 帧）
- 已有 `"stdout"`/`"stderr"` 监听器调 `_formatPayload` 包一层再 append，对象 payload 不再显示 `[object Object]`

### 验证
- ✅ `node --check` 通过（HB node v24.17.0）
- ✅ `vite build` 成功
- ✅ 5 副本同步

### 副本同步清单（仅 preload.js）
psychopy-oh-v0.1.6/：web_engine、hap_inspect、electron/build
Documents/ohos_electron_hap-main_Psychopy_v0.1.6/：web_engine、electron/build、resources

---

## 环境备忘
- 系统 `node` v24.13.0 **坏的**（native crash exit 133），用 HarmonyBrew 的：`~/.harmonybrew/Cellar/node@24/24.17.0/bin/node`
- `ast-grep` 二进制未安装，验证用 `grep` + Python ast.parse + HB node --check 组合
- 项目无 `package.json scripts`，构建直接调 `node_modules/vite/bin/vite.js build`

---

## [2026-07-15 13:54] — psychopy `'general'` KeyError + 鸿蒙 platform.system() 兜底

### 根因（从用户实机 terminal 日志诊断）
日志：`[liaison-shim] WARNING: Failed to import psychopy: 'general'` + diagnose 报 `psychopy: NOT AVAILABLE`

1. **`platform.system()` 鸿蒙返回 `'HarmonyOS'`**：`preferences.py:161` 用 `platform.system() + '.spec'` 找 spec 文件，但 `psychopy/preferences/` 只有 `Darwin/FreeBSD/Linux/Windows.spec`，**没 `HarmonyOS.spec`** → `prefsSpec` 加载空 → `validate()` 没默认值可填 → `cfg['general']` 抛 `KeyError: 'general'` → `import psychopy` 失败
2. **`userPrefs.cfg` 首次启动不存在**：`loadUserPrefs()` 加载空 cfg，`loadAll:309` `self.userPrefsCfg['general']` 抛 `KeyError`。`restoreBadPrefs()` 行 439-445 处理 missing section 时**只打印 msg 不创建 section** → 依然 KeyError。这是 psychopy 自身 bug 在首次启动时触发

### 改动文件
**`electron/src/python/liaison_shim.py`**（7 副本全同步）：
在 `import psychopy` 前插入两段兜底：
- **monkey-patch `platform.system()` 返回 `'Linux'`**：鸿蒙 POSIX 兼容，Linux.spec 内容适用
- **预置最小 `userPrefs.cfg`** 到沙箱可写目录 `$HOME/.psychopy3/userPrefs.cfg`，含全部 8 个必需 section（general/app/coder/builder/hardware/piloting/connections/keyBindings）+ 最小默认键，仅当文件不存在时写入

### 验证
- ✅ `python3 ast.parse` 通过
- ✅ 7 副本同步

### 备注
- 日志末尾 `OSError: [Errno 98] Address in use` 来自 Python REPL 用户手动启 `http.server`，**不是 liaison 重启问题** — liaison_shim.py 的 `find_free_port` 从 8002 递增找空闲端口不会冲突
- `liaison: not started` 是因 import psychopy 失败 → liaison 进程 close → `_liaisonReady=false`。修了 import 后此问题自动消失
- 未跑 vite build — 本轮只改 liaison_shim.py（electron 后端文件，不进前端 bundle）

---

## [2026-07-15 16:40] — MinimalWebSocket 缺 readyState → sendLiaison 永远抛 "Liaison not connected"

### 根因（从前端 profiles.svelte.js + sendLiaison 审出）
"Failed to load Components" + 大量功能只用占位符 fallback 的根因：
- `harmony-python.js:438` `sendLiaison` 检测 `_liaisonSocket.readyState !== WebSocket.OPEN`
- `MinimalWebSocket` **没实现 `readyState` 属性** → undefined !== 1 永远 true → 抛 `"Liaison not connected"`
- 所有前端 `python.liaison.send("app", {command, args})` 调用失败 → Components/Loops/Devices/ColorPicker/FontManager/MonitorCenter 全瘫
- 前端 `profiles.svelte.js:24` `python.liaison.ready("app").then(...)` 永不 resolve → `pending.components` 永远是初始 `Promise.resolve()` → Components 永不刷新

### 改动文件
**`electron/src/harmony-python.js`**（5 副本全同步 + vite build）：
给 `MinimalWebSocket` 加 `readyState` 属性 + RFC 6455 §4.1 静态常量：
- `static CONNECTING=0; static OPEN=1; static CLOSING=2; static CLOSED=3;`
- constructor 设 `readyState = CONNECTING`
- 握手成功（`101` 响应）设 `readyState = OPEN`
- socket `close` 事件设 `readyState = CLOSED`
- `close()` 方法走 `CLOSING → CLOSED`

### 验证
- ✅ `node --check` 通过（HB node v24.17.0）
- ✅ `vite build` 成功
- ✅ 5 副本同步

### 副本同步清单（仅 JS）
psychopy-oh-v0.1.6/：web_engine、hap_inspect、electron/build
Documents/ohos_electron_hap-main_Psychopy_v0.1.6/：web_engine、electron/build、resources

### 备注
- 本轮是 MinimalWebSocket 上线后最后一个状态机缺口，配合 [11:11] liaison stderr 同步 + [13:54] psychopy import 兜底，liaison 通信链路完整：WebSocket 连上 → readyState=OPEN → sendLiaison 通过 → 命令发出 → liaison_shim.py 处理 → 返回 → 前端刷新
- 部署后预期：Components 正常加载（不再 "Failed to load Components"）、ColorPicker 颜色转换、FontManager 字体扫描、MonitorCenter 校准全通

---

## [2026-07-15 17:14] — PsychoJS 端口冲突 + 前端 liaison.ready 不检查返回值

### 根因（从用户实机"Run in browser"traceback 诊断）
1. **`Address in use` traceback**：`_startPsychoJS` 行 873 **硬编码 `port=8002`**，liaison 已占 8002 → `http.server` bind 失败 → Run in browser 报错
2. **刷新 Components 没反应**：`profiles.svelte.js:24` `python.liaison.ready("app").then(...)` `.then` 没检查 `ready===false`，liaison 未连时依然发 `liaison.send` → `sendLiaison` 抛错 → `.catch(handleError)` 静默吞 → 刷新按钮看似没反应
3. **Python error 控制台空白**：liaison stderr 推 `{error: text}` 到 `stderr` 通道，但 liaison 进程根本没启动成功时 stderr handler 没机会触发。修了前两个问题后自然解决

### 改动文件
**`electron/src/harmony-python.js`**（5 副本全同步 + vite build）：
- `_startPsychoJS` 端口从硬编码 8002 改为动态找空闲端口（从 8003 递增到 8100，用 `net.createServer` 试听）
- PsychoJS server stderr 也包成 `{error: text}` 结构发到 `stderr` 通道让 PythonErrors 窗能显示

**`src/lib/experiment/profiles.svelte.js`**（前端 Svelte 源，vite build 进 bundle）：
- `python.liaison.ready("app").then(...)` `.then` 加 `(ready) => { if (!ready) return; ... }` 检查返回值，liaison 未连时保持 fallback profiles 不发命令

### 验证
- ✅ `node --check` 通过（HB node v24.17.0，两文件都验）
- ✅ `vite build` 成功
- ✅ 5 副本同步（仅 JS，前端 Svelte 源走 build）

### 副本同步清单（仅 JS）
psychopy-oh-v0.1.6/：web_engine、hap_inspect、electron/build
Documents/ohos_electron_hap-main_Psychopy_v0.1.6/：web_engine、electron/build、resources

### 备注
- 本轮修完三个症状：刷新 Components 没反应、Run in browser `Address in use`、Python error 控制台空白
- 部署后预期：Run in browser 启 HTTP server 在 8003+ 空闲端口、Components 刷新按钮 liaison 未连时静默保持 fallback 不再看似卡死、Python error 弹窗点击后控制台显示真实 stderr 文本

---

## [2026-07-15 20:53] — 刷新 Components 组件消失 + python.ready 误置 true

### 根因（从用户实机"点刷新 components 就消失"诊断）
1. **`refreshProfiles` 行 75 `if (await python?.ready)`** — `python.ready` 是 boolean 不是 Promise，`await boolean` 永远 OK 但 liaison 实际未连时也发命令 → `sendLiaison` 抛错 → `profilesPending.components` reject → `{#catch}` 分支渲染 → 之前 fallback 的组件也消失了
2. **`functions.svelte.js:150-154` `python.liaison.ready(version).then(evt => { python.ready = true })`** — `.then` 没检查 `ready` 返回值，liaison 启动失败返回 `false` 时 `python.ready` 依然被置 `true` → 后续所有功能误以为 Python 准备好了误发命令
3. **行 144 `err.error?.join?.("\n")`** — liaison RCP error 帧 `msg.error` 是 `{message, traceback}` 对象不是数组，`.join` 是 undefined → 显示空

### 改动文件
**`src/routes/builder/components/Panel.svelte`**（前端 Svelte 源，vite build 进 bundle）：
- `refreshProfiles` 改为：先 `python.liaison.ready("app")` 检查 liaison 真连，未连时静默 return 保持原 profiles 不刷新
- `liaison.send` 包 try/catch，命令报错时不覆盖 `profilesPending.components` 避免组件消失

**`src/lib/python/functions.svelte.js`**（前端 Svelte 源，vite build 进 bundle）：
- `python.liaison.ready(version).then(...)` `.then` 加 `if (ready)` 检查返回值，未连时 `python.ready` 保持 false 不被误置 true

### 验证
- ✅ `node --check` 两文件通过（HB node v24.17.0）
- ✅ `vite build` 成功

### 备注
- 本轮是 [17:14] 的补刀 — 上轮只修了 `profiles.svelte.js` 的 `.then` 检查，漏了 `functions.svelte.js` 的同样 bug 和 `refreshProfiles` 的 `await python?.ready` 误用
- 部署后预期：刷新 Components 按钮 liaison 未连时静默保持 fallback（不再组件消失）、liaison 真连时正常刷新、Python 功能不再误以为 ready 发命令

---

## [2026-07-15 21:28] — wx mock 补全 + soundfile stub → getAllComponents/writeScript 真跑通

### 根因（实机 Python 复现 + traceback 诊断）
`logging is not defined` 真根因链（用 `/data/service/hnp/python.org/python_3.12/bin/python3` 复现）：
1. `psychopy.localization._localization:52` `wx.Locale()` → 原 `_mock_wx` 只建空模块没 `Locale` 类 → AttributeError
2. → localization import 失败 → data → experiment 整个链断
3. → liaison 调 `getElementProfiles`/`writeScript` 时 `_experiment.py` 没加载成功 → 报 `logging is not defined`

补全 wx mock 后又报：
4. `psychopy.tools.audiotools:108` `sf.available_formats()` → 鸿蒙缺 `libsndfile.so` C 库 → `import soundfile` OSError → microphone/camera 组件 import 失败 → `getAllComponents` 报错

### 改动文件
**`electron/src/python/liaison_shim.py`**（7 副本全同步）：

1. **`_mock_wx` 补全** — psychopy.localization._localization 行 35-155 用到的 wx API 全 stub：
   - `LANGUAGE_DEFAULT = 0`
   - `Locale` 类：`GetLocale`/`GetCanonicalName`/`GetSystemLanguage`/`GetLanguageInfo`/`IsAvailable`
   - `GetTranslation`/`__version__`

2. **新增 soundfile stub** — 鸿蒙缺 `libsndfile.so` C 库，`import soundfile` 抛 OSError。stub 核心 API：
   ```python
   try: import soundfile  # 试真 import，能成就不用 stub
   except (OSError, ImportError):
       # stub read/write/info/available_formats/available_subtypes/Format/Subtype/default_options
       sys.modules['soundfile'] = _sf_stub
   ```
   liaison 后端只拿 Component 元数据不需要真跑音频，stub 让 import 链通即可

### 验证（实机 `/data/service/hnp/python.org/python_3.12/bin/python3`）
- ✅ `psychopy 2025.2.4 OK`
- ✅ `getAllComponents OK count= 35`（ApertureComponent/PolygonComponent/BrushComponent/ButtonComponent/ButtonBoxComponent…）
- ✅ `writeScript OK len= 17852`（生成 17KB Python 实验脚本）
- ✅ `python3 ast.parse` 通过
- ✅ 7 副本同步

### 副本同步清单（仅 liaison_shim.py）
psychopy-oh-v0.1.6/：web_engine、hap_inspect、electron/build、根目录
Documents/ohos_electron_hap-main_Psychopy_v0.1.6/：web_engine、electron/build、resources、根目录

### 备注
- 这是 liaison 通信链的最后一公里 — [16:40] MinimalWebSocket readyState 修了 WebSocket 状态机，本轮修了 psychopy import 链最后两个鸿蒙缺口
- 部署后预期：Components 刷新真出 35 个组件、Run in browser 真生成 17KB Python 脚本、writeScript 不再报 `logging is not defined`
- `pytables package not found` WARNING 是 ioHub hdf5 功能disabled，不影响主链，未修

---

---

---

---

---

---

## [2026-07-15 11:11] — liaison Python 后端动态全同步到前端两窗口（debug 用）

### 根因（从前端源码审出）
1. **PythonErrors.svelte（右下角弹窗）空白**：前端 `python.output.stderr.listen` 收 `"stderr"` 通道，行 52 `errors.map(err => err.content.error).join("\n")` 要 `err.content.error` 是 **string**。但 harmony-python.js liaison stderr handler 只调 `output("stderr", text)` 推原始字符串 → `err.content` = string，`err.content.error` = `undefined` → 弹窗空白。
2. **SetupPython.svelte（reinstall 窗）空白**：前端 `electron.windows.listen("uv", ...)` 监听 `"uv"` 通道写进 `status.logs` 显示。但 harmony-python.js liaison 进程 stdout/stderr 从不发 `"uv"` 通道 → logs 永远空。
3. **liaison RCP error 帧丢弃**：行 394 `reject(msg.error || msg)` 把命令报错当 RCP 静默处理，前端看不到命令执行的错误内容。
4. **liaison:error 通道未发**：前端 `python.liaison.listen("error", ...)` 监听 `"liaison:error"` 通道，主进程从不发。

### 改动文件
**`electron/src/harmony-python.js`**（5 副本全同步 + vite build）：
- liaison stdout handler：加发 `"uv"` 通道给 SetupPython 窗
- liaison stderr handler：
  - 包成前端期望的 `{error: "string"}` 结构（**不能嵌套 `{error:{message,traceback}}`** — 前端 `.map(err => err.content.error).join("\n")` 在对象数组上会 TypeError）
  - 发 `"stderr"` 通道给 PythonErrors 窗
  - 发 `"liaison:error"` 通道给 `python.liaison.listen("error")`
  - 发 `"uv"` 通道给 SetupPython 窗
- liaison RCP error 帧（reject 分支）：
  - 把 `msg.error.{message, traceback}` 拼成可读字符串
  - 发 `"stderr"` + `"liaison:error"` 通道让前端两个 listener 都收到

### 验证
- ✅ `node --check` 通过（HB node v24.17.0）
- ✅ `vite build` 成功（10.73s）
- ✅ 5 副本同步

### 副本同步清单（仅 JS，本轮没改 py）
psychopy-oh-v0.1.6/：web_engine、hap_inspect、electron/build
Documents/ohos_electron_hap-main_Psychopy_v0.1.6/：web_engine、electron/build、resources

---

## [2026-07-15 21:46] — HarmonyBrew libsndfile 真库替换 stub（不 stub 原则）

### 根因
上轮 [21:28] stub soundfile 敷衍了鸿蒙缺 libsndfile.so C 库问题。用户要求真库真跑。

### 改动
1. **HarmonyBrew 装真 libsndfile**：`brew install libsndfile` → `~/.harmonybrew/Cellar/libsndfile/1.2.2_1/lib/libsndfile.so` 真存在
2. **删 liaison_shim.py 的 soundfile stub** — 不再 stub 敷衍
3. **harmony-python.js `getPythonEnv()` 加 LD_LIBRARY_PATH** 指向 HarmonyBrew Cellar 的 libsndfile + lib — 父进程 spawn Python 时就带，linker 真能搜到（子进程内 os.environ 设太晚不生效）

### 验证（实机鸿蒙系统 Python）
- ✅ `soundfile 0.14.0 OK, formats: ['AIFF', 'AU', 'AVR', 'CAF', 'FLAC']` — 真库真加载
- ✅ `getAllComponents OK count= 35`
- ✅ `writeScript OK len= 17852`
- ✅ node --check + python3 ast.parse 通过
- ✅ vite build 成功
- ✅ 5 JS + 7 PY 副本同步

### 关键学习
- 子进程内 os.environ 设 LD_LIBRARY_PATH 太晚：linker 在 Python 启动时已搜完库路径，必须父进程 spawn 时就设
- HarmonyBrew venv Python 3.14 路堵：numpy 二进制是 musllinux 版，鸿蒙沙箱加载 .so 权限被拒。用鸿蒙系统 Python 3.12 + LD_LIBRARY_PATH 指向 HarmonyBrew Cellar 真 C 库

---

## [2026-07-15 22:30] — 删 UV/venv/getPackageDetails stub 改真行为 + 错误全到 terminal

### 删的逃避（stub/mock 假返回）
- **UV stubs** (harmony-python.js:615-622) 7 个假 IPC 假返回 → 改真行为：
  - `uv.exists` 真检查 Python 路径在不在
  - `uv.findPython` 返回真 Python 路径或 null
  - `uv.install`/`makeExecutable` 验 Python 可用 + 错误真出到 stdout/stderr/uv 通道
  - `uv.getEnvironments` 真探 Python 版本返回真环境列表（非空 []）
  - `uv.folder` 返回 Python 所在目录
- **`venv.setup`** `() => Promise.resolve(true)` → 改真 `python --version` 验可用 + 输出到 terminal
- **`getPackageDetails`** `() => Promise.resolve({})` → 改真 `pip show` 拿包详情转对象

### 保留的 mock（非逃避）
- `_mock_pyqt5/6`、`_mock_wx` — GUI 兜底：鸿蒙无 PyQt/wx，psychopy GUI 模块 import 解析但 liaison 后端不真调
- `fallbacks/getLocal.py` + fallback JSON — liaisons 原设计 fallback 链（liaison 未连兜底）

### 错误信息到 terminal
新改的 UV/venv/getPackageDetails handler 全部：
- `output("stderr", {error: msg})` → `"stderr"` 通道 → PythonErrors 弹窗 + 自加 terminal
- `win.webContents.send("uv", msg)` → `"uv"` 通道 → SetupPython 窗 + 自加 terminal
- `output("stdout", msg)` → `"stdout"` 通道 → 自加 terminal
配合 [11:33] preload.js 已监听 stdout/stderr/uv/liaison:error 四通道，所有 Python 后端动态真到自加 terminal

### 外部打开（第 3 点诉求）— 不强改
审：`shell.openPath/openExternal` (index.cjs:554-555) 是 Electron-OH 原生 API，鸿蒙沙箱内无 xdg-open/open/start 等系统打开工具。强加 proc.execSync fallback 调不存在工具只引入新错误。若实机测出 shell.openExternal 不工作，再说鸿蒙 Ability 启动方案（需 `aa startAbility` 权限，沙箱内不可用）

### 验证
- ✅ node --check 通过（HB node v24.17.0）
- ✅ vite build 成功
- ✅ 5 副本同步

---

## [2026-07-15 22:48] — PyQt/wx mock 性质判定 + 鸿蒙原生 GUI 适配探索

### PyQt/wx mock 性质判定（不是 stub/逃避）
- **触发时机**：psychopy 包加载时被动解析顶层 import（`psychopy.localization._localization:31 import wx`、`psychopy.tools.wizard:22 from wx import`、`psychopy.visual.backends` 各模块顶层 `from PyQt5.QtCore import QObject`）
- **liaison 后端真触吗**：不触。实机验证 `PSYCHOPY_NO_GUI=1` + mock 时 `getAllComponents`/`writeScript`/`getLoopProfiles`/`getDeviceProfiles` 真跑通（35 组件 + 17KB 脚本）
- **PyQt/wx 真调点**：只在 `app/_psychopyApp.py`（GUI 主框）、`tools/wizard.py:559/601/686`（`wx.LaunchDefaultBrowser` 装包向导）、`tools/pkgtools.py:621`（`wx.MessageDialog` 弹错框）—— 全是 GUI 模式用户交互路径，liaison 后端命令链不触
- **删了会怎样**：import 直接抛 ImportError → localization → data → experiment 整链断 → liaison 调 `getAllComponents`/`writeScript` 报 `'general'` KeyError（上轮真发生过）
- **类比**：声卡没接但驱动要能加载，加载时不真录音。mock 类是死代码兜底，不被真执行
- **和 X11 的区别**：X11 mock 是逃避（假开窗假 RT 数据欺骗用户），PyQt/wx mock 不是（liaison 后端不真调这些 GUI 类）

### 鸿蒙装 PyQt/wx 三条路全堵
| 路径 | 实测结果 |
|------|----------|
| 鸿蒙社区 pip 源 `pypi.cnb.cool` | PyQt5/6 `Failed to build`，wxpython `No matching distribution` — 源里没预构建鸿蒙 wheel |
| HarmonyBrew `brew install` | 没 PyQt5/6/wx 包，只有 `pyqt-builder`（编译工具非二进制） |
| 本地编译 + ohos-pip-autosign | 理论可，但要 Qt5/6 C 源码 + X11/Wayland 头文件 + 鸿蒙签名链。鸿蒙沙箱无 X11/Wayland |

### 交叉编译 PyQt/wx 技术上有路但无收益
| 维度 | 实测 |
|------|------|
| 鸿蒙 clang 交叉编译器 | ✅ `/data/service/hnp/bin/clang` 在 |
| binary-sign-tool 自签名 | ✅ HarmonyBrew `~/.harmonybrew/bin/binary-sign-tool` 在 |
| OHOS SDK sysroot | ❌ 设备上没装（开发机才有） |
| X11/Wayland 头文件 | ❌ 鸿蒙沙箱没有 |
| Qt 库 | ❌ 没 Qt5/6 .so |
| Qt for HarmonyOS 官方分支 | ✅ `tqtc-qt5` Qt5.12.12/5.15.16 + `ohos-clang` 平台 + `libqohos.so` QPA 插件 |

**三个堵点**：
1. Qt 交叉编译本身（中成本，1 天）— 下载 `tqtc-qt5` + OHOS SDK sysroot + configure + make
2. PyQt Python binding 构建（高成本，3-5 天）— sip + Qt 库 + Python.h，鸿蒙 Python 的 `ohos-pip-autosign` 能签 .so 但 sip 链无人验证
3. PyQt API 行为差异（高成本，改 psychopy 源码）— psychopy 调 `QApplication.exec()` 主框事件循环、`wx.MessageDialog` 弹框、`QDesktopServices.openUrl` 开浏览器 — 鸿蒙 Qt 的 `libqohos.so` QPA 不走 X11，这些调用要么抛错要么走鸿蒙 Ability 机制

**判断**：liaison 后端真不调 PyQt/wx GUI API，花 5 天交叉编译 + 改 psychopy 源码适配鸿蒙 Qt，结果 liaison 后端还是不触这些 GUI 类 — 零收益。当前 mock 是正确工程决策。

### "Run in browser" 不走 PyQt/wx，可以跑
链路：点 Run in browser → `callbacks.svelte.js:275 runJS()` → `experiment.svelte.js:571 runJS(compile=true)` → 行 476 `python.liaison.send(... "currentExperiment.writeScript" ...)` → liaison 后端生成 Python 脚本路径（不触 PyQt/wx GUI）→ Electron 启 PsychoJS HTTP server（`_startPsychoJS`，动态找 8003+ 空闲端口）→ 浏览器开 PsychoJS 跑 JS 版实验。全链不触 PyQt/wx GUI API，mock 不影响。

### 鸿蒙官方文档表态（`harmonyos-dev` skill 检索）
鸿蒙官方 GUI 路径只有 ArkTS UI（@State/@Link/@Builder）+ ArkUI X（iOS/Android 跨平台，鸿蒙不接 PyQt）。鸿蒙官方根本不支持 PyQt/wx 这种 X11/Wayland 系桌面 GUI 栈 — 不是「缺包待移植」，是「架构不兼容」。

### 关键 URL（供后续探索）
- Qt for HarmonyOS 交叉编译指南：https://wiki.qt.io/Qt_for_HarmonyOS/user_development_guide/deveco_cmake_guide_cross_compile_zh
- Qt for HarmonyOS 源码：https://wiki.qt.io/Qt_for_HarmonyOS/zh（`tqtc-qt5` git clone + `ohos-clang` configure）
- 鸿蒙 PyQt 桌面应用开发（CSDN）：https://blog.csdn.net/umut9/article/details/147840004
- Qt 开源软件适配鸿蒙 PC 实战：https://ai6s.net/6a13bec9662f9a54cb76d939.html
- Build Qt for OpenHarmony 自动化构建工具：https://gitcode.com/qq_28312849/Build
- vcpkg-ohos 给鸿蒙编译 C/C++ 三方库：https://www.qt.io/zh-cn/blog/building-libraries-for-harmonyos-with-vcpkg

---

## [2026-07-15 23:22] — 按钮消失 + 切换丢文件两 regression 修

### 根因
1. **刷新 Components / Run in Python 按钮消失**（全是无 Python 默认界面）：
   - `functions.svelte.js:137` `if (await python.liaison.started(version))` 走"已连"分支行 140 `status.ready.resolve(true)` **但不设 `python.ready=true`**
   - 行 150 `python.liaison.ready().then(ready => if(ready) python.ready=true)` 是异步，设上前按钮 `{#if python?.ready}` 不渲染
   - 已连时 `liaison.ready` 必返 true，直接设 `python.ready=true` 不等异步
2. **切换不保留打开内容**：
   - `sharedViewStore.svelte.js:64` `flushBeforeNavigate` 只设 `currentFile` $state，靠 `$effect.root` 异步落 localStorage
   - HTTP 整页重载（windows.navigate/goto）触发重载时 $effect 可能没落盘 → localStorage 空 → 重载后 consumeCurrentFile 读 null → 文件丢

### 改动
**`src/lib/python/functions.svelte.js`**（vite build 进 bundle）：
- 行 137 "已连"分支加 `python.ready = true`，不等行 150 `.then` 异步设

**`src/lib/sharedViewStore.svelte.js`**（vite build 进 bundle）：
- `flushBeforeNavigate` 加同步 `_writePersist(...)` 落 localStorage，不等 `$effect` 异步
- `activeView` 也同步落 localStorage（`ACTIVE_VIEW_KEY`），重载后从 localStorage 恢复

### 验证
- ✅ node --check 两文件通过
- ✅ vite build 成功

### 备注
- 本轮是 [20:53] 的补 regression — 上轮改 `.then(ready => if(ready))` 检查返回值，但漏了"已连"分支直接设 `python.ready` 的同步路径
- 部署后预期：按钮真显示（不再全是无 Python 默认界面）、切换 builder/coder/runner 保留打开文件不丢

---

## [2026-07-16 22:30] — 三个根因修复：ECONNREFUSED + json_tricks + 全量缺失包检查

### 修复 1 — LIAISON_START@ 打印顺序导致 ECONNREFUSED
**根因**：`main()` 在 `websockets.serve()` 启动监听之前就打印了 `LIAISON_START@{port}`。`startLiaison` 检测到后立即创建 WebSocket 连接，但服务器还没开始监听 → `ECONNREFUSED` → `_liaisonReady` 保持 false → 所有 `sendLiaison` 抛 `"Liaison not connected"` → 前端所有命令失败。
**修复**：把 `LIAISON_START@` / `Listening on ws://` / `PsychoPy ready` 三个 print 移到 `async with websockets.serve(...)` 块内，服务器启动后再打印。
**文件**：`liaison_shim.py` 的 `main()` 函数
**提交**：`da07955`

### 修复 2 — json_tricks 找不到
**根因**：`psychopy/data/base.py:13` import `json_tricks`。`pip install json_tricks` 装在 `~/.local/lib/python3.12/site-packages`，但 `_HARMONY_SITE_PATHS` 不包含该路径 → `ModuleNotFoundError` → `psychopy.data` 加载失败 → `from psychopy import data, logging` 在 `params.py:25` 失败 → `logging is not defined`。
**修复**：`_HARMONY_SITE_PATHS` 加 `os.path.expanduser("~/.local/lib/python3.12/site-packages")` 和 dist-packages。
**文件**：`liaison_shim.py` 的 `_HARMONY_SITE_PATHS` 列表
**提交**：`ac1d520`

### 修复 3 — 全量缺失包检查
**方法**：遍历 psychopy 源码所有 import，过滤 stdlib + 平台特有 + 已 mock + 已装包，精筛真正缺失的第三方包。
**结果**：`json_tricks` 是唯一阻塞关键路径的包。`jsonschema` 依赖 `rpds-py` 需编译 C 扩展（系统 pip 卡住），但不阻塞 `writeScript`/`getAllComponents` 关键路径。
**提交**：`ac1d520`

### 当前完整修复清单
| 修复 | 提交 | 根因 |
|------|------|------|
| userPrefs.cfg 缺 `paths` 键 → 预置 + 已存在时补写 | 之前 | `prefs.general['paths']` KeyError |
| `LD_LIBRARY_PATH` 在父进程 spawn 时设好 | 之前 | libsndfile.so 找不到 |
| 删 UV/venv/getPackageDetails stub 改真行为 | 之前 | 逃避行为 |
| LIAISON_START@ 打印移到 serve 启动后 | `da07955` | 服务器未监听就连接 ECONNREFUSED |
| _HARMONY_SITE_PATHS 加 .local | `ac1d520` | json_tricks 找不到 |

### 下一步
拉取 -> 打包 HAP -> 部署 -> 验证 Components 刷新 / Write script / Run in browser

---

## [2026-07-16 17:05] — hap_inspect 副本缺 json_tricks（d4be095 漏改）补齐

### 症状（设备端 PsychoPy Terminal 打开即报）
- `[liaison-shim] cmd_run _import_target failed: No module named 'json_tricks'`
- `ModuleNotFoundError: No module named 'json_tricks'` at `psychopy/data/base.py:13`
- `psychopy not available, returning empty for: psychopy.experiment:getElementProfiles`（及 getLoopProfiles/getDeviceProfiles）
- UI 操作报 `Error in 'Write experiment as a .js file'` / `logging is not defined`
- Run in browser / Run .py / Run .js 全转半天空白

### 根因链（一个缺失引发所有症状）
```
json_tricks 缺失
  → psychopy/data/base.py:13 import 失败
  → psychopy.data 无法加载
  → psychopy/experiment/params.py:25 `from psychopy import data, logging` 失败
  → 'logging is not defined'（writeScript/getElementProfiles 都报这个）
  → psychopy.experiment 整个 import 链断
  → getAllComponents / getAllStandaloneRoutines / getAllElements 全空
  → Write/Run .js、Run in browser、Run .py 全失效（底层都依赖 getElementProfiles）
```

### 修复
上游 `d4be095`（2026-07-16 16:30）把 json_tricks 9 个文件打包进项目 `electron/src/python/lib/json_tricks/`，但**只加到了 `web_engine/` 副本**，漏了 `hap_inspect/` 副本。设备运行时 liaison_shim.py 的 sys.path 走 `electron/src/python/lib`（对应 hap_inspect 那份），所以拿不到 json_tricks。

本轮把 web_engine 副本里的 json_tricks 9 个文件复制到 hap_inspect 对应 lib 目录，两份副本一致。

**验证**：两副本 json_tricks 均含 9 个文件（`__init__.py`, `_version.py`, `comment.py`, `decoders.py`, `encoders.py`, `nonp.py`, `np.py`, `np_utils.py`, `utils.py`），共 1474 行新增。

**部署提示**：改源码不够，需要**重新打包 HAP**（hvigor 构建）并重装到设备，让含 json_tricks 的新 lib 目录随包烧进去。

**提交**：`ceb92e1`

### 副本一致性陷阱（记录给后续）
项目里 `liaison_shim.py` 有 3 份副本、`electron/src/python/lib/` 有 2 份副本（hap_inspect 和 web_engine），任何往 lib 里加包必须**两份都加**，否则设备端报 ModuleNotFoundError。

### 旁路：XCollie "Failed to open file: /sys/power/last_sr" 日志
设备 hilog 持续每 ~3 秒报此错，是 HarmonyOS 内核层 XCollie 系统看门狗轮询电源状态时读不到 `/sys/power/last_sr` sysfs 节点。纯系统日志，与 psychopy-oh / Electron 应用代码无关（全项目 12,107 文件搜索无任何引用），无害，无法从应用层修复，**直接忽略**。

---

## [2026-07-17 08:57] — astunparse 缺失补齐（json_tricks 修复后的下一环）

### 症状
json_tricks 补齐后 import 链往前走一步，断在：
- `ModuleNotFoundError: No module named 'astunparse'` at `psychopy/experiment/py2js.py:15`
- 同链引发 `psychopy.experiment getAllComponents / getAllStandaloneRoutines / getAllElements` 全空
- Write/Run .js、Run in browser、Run .py 仍失效

### 根因
`psychopy/experiment/params.py:27` `from . import py2js` → `py2js.py:15` `import astunparse`。astunparse 是纯 Python 包（4 个 .py 文件：`__init__.py`/`__main__.py`/`printer.py`/`unparser.py`），依赖 six（设备已有）和 wheel（stdlib 类），但设备 site-packages 和项目 lib 均无。

### 修复（第一轮：复制到 lib 目录 — 失败）
从 `~/.local/lib/python3.12/site-packages/astunparse/`（本机 pip 装好的 v1.6.3）复制到项目 lib 两份副本：
- `hap_inspect/.../electron/src/python/lib/astunparse/`（4 文件，设备运行时用这份）
- `web_engine/.../electron/src/python/lib/astunparse/`（4 文件，与 hap_inspect 一致）

清理 `__pycache__`，避免打包进 HAP。本地模拟验证：加 wx mock + soundfile mock + 预置 userPrefs.cfg 后，import 链已穿过 `py2js`/`experiment`（断点挪到 preferences 配置，liaison_shim.py 在设备端会处理）。

**但 HAP 构建多次漏打包该目录**，无论加在 `resources/resfile/` 还是 `web_engine/src/main/resources/resfile/` 都不被包含，设备端始终报 ModuleNotFoundError。

### 最终修复（成功：嵌入 liaison_shim.py 运行时 fallback）
改为在 `liaison_shim.py` 中**嵌入 astunparse 完整源码作为运行时 fallback**（~290KB 内联代码，含 `__init__.py` / `printer.py` / `unparser.py` 三文件）。机制：
1. `try: import astunparse` — 如果 HAP 里真的打包了 astunparse/ 目录，走正常 fast path
2. `except ImportError:` — 否则用 `exec()` 把 inline 源码注入到 `sys.modules["astunparse"]`
3. 打印 `[liaison-shim] astunparse loaded from inline fallback (v1.6.3)` 确认 fallback 生效

三份 `liaison_shim.py` 副本同步（root / web_engine / resources，各 1059 行）。

**关键经验**：HAP 构建系统对 `resources/resfile/` 目录下的文件有选择性地打包，某些纯 Python 包目录可能被跳过。`liaison_shim.py` 是设备端 Python 入口，它是**唯一 100% 可靠**的注入点。对所有纯 Python 小包，如果 HAP 构建反复漏打包，应采用"嵌入到 liaison_shim.py 作为运行时 fallback"的策略。

**提交**：`c15fead`（已 push）

### 全量缺包扫描结论
遍历 `psychopy/{experiment,data,logging,tools,version}` 链上所有 .py 的 import，对照设备 site-packages + 项目 lib + liaison_shim.py mock 列表：
- **关键链唯一缺**：`astunparse`（本轮补）
- 其他 MISS 包均在非关键路径：`soundfile`（audiotools，liaison_shim.py 用 HarmonyBrew libsndfile 加载）、`h5py`/`tables`（ioHub hdf5，disabled）、`questplus`/`psychtoolbox`/`psychxr`/`moviepy`/`meshpy`/`metapensiero`/`Image`（freetype）/`cPickle`（platform-specific 或可选，不阻塞 getAllComponents/writeScript）

### 部署提示
改源码不够，需**重新打包 HAP**（hvigor 构建）并重装到设备，让含 astunparse 的新 lib 目录随包烧进去。

---
