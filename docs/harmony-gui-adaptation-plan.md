# 鸿蒙原生 GUI 适配探索 — psychopy stimulus + Qt 桌面应用

> 用途：记录将来真跑 psychopy GUI 实验 / 桌面 Qt 应用在鸿蒙跑的两条路探索。
> 现状（2026-07-15）：liaison 后端已真跑通（getAllComponents/writeScript），PyQt/wx mock 是死代码兜底 liaison 后端不触。**本文档探索的是将来真开 stimulus 窗口给被试看**的另一工程。
> 关联文件：`CHANGELOG-AtomCode.md` 22:48 条目（PyQt/wx 性质判定 + 交叉编译无收益结论）

---

## 路径 A — psychopy 鸿蒙原生 GUI 适配（`visual.Window` 改调 ArkUI/`libqohos.so`）

### 目标
真跑 psychopy GUI 实验 — 开 stimulus 窗口给被试看，收 RT 数据。不经过 Qt/PyQt，直接鸿蒙原生渲染。

### 为什么不走 PyQt 交叉编译
- PyQt 交叉编到鸿蒙要 5 天（Qt 编译 + sip binding + API 适配），结果 liaison 后端还是不触 GUI API — 零收益
- psychopy 调 `QApplication.exec()` 主框事件循环、`wx.MessageDialog` 弹框、`QDesktopServices.openUrl` 开浏览器 — 鸿蒙 Qt 的 `libqohos.so` QPA 不走 X11，这些调用要么抛错要么走鸿蒙 Ability 机制，要改 psychopy 源码适配
- 华为官方推荐路径：Qt for HarmonyOS 也是走 ArkUI 后端，不是 X11 桌面 Qt

### psychopy visual.Window 真依赖什么
psychopy `visual.Window` 核心渲染走：
- **`pyglet`/`pygame`** — OpenGL 窗口库（psychopy 默认 backend）
- **`glfw`** — 备选 OpenGL 窗口库
- **`QtOpenGL`** — PyQt backend 时走 Qt OpenGL

鸿蒙原生 OpenGL ES 3.0 可用（`libGLESv3.so`），不一定要经过 Qt。

### 适配方案草案
1. **找鸿蒙原生 OpenGL ES 窗口库** — 鸿蒙有 `libGLESv3.so` + ArkUI 的 `XComponent` 组件可嵌原生 OpenGL 渲染
2. **写 psychopy `visual.backends.ohos` 新 backend** — 实现 `WindowOHOS` 类，调鸿蒙原生 OpenGL ES 渲染 stimulus
3. **psychopy `visual.Window` 加 backend 选择** — `win = Window(backend='ohos')` 走鸿蒙原生
4. **事件循环** — 鸿蒙 `XComponent` 事件回调替代 pyglet/pygame 主循环
5. **输入设备** — 鸿蒙触摸事件替代 pyglet 鼠标/键盘事件

### 关键技术点
- 鸿蒙 `XComponent` 是 ArkUI 里嵌原生 OpenGL 渲染的组件，需要在 ArkTS UI 层声明，native 层用 NAPI 桥接
- psychopy stimulus 渲染（GratingComponent/VisualComponent 等）用 OpenGL shader，鸿蒙 OpenGL ES 3.0 支持
- RT 数据收集 — 鸿蒙触摸事件时间戳精度够吗？需验证

### 探索步骤
1. 验证鸿蒙 `libGLESv3.so` + `XComponent` 能真跑 OpenGL ES 3.0 stimulus 渲染
2. 写最小 psychopy `visual.backends.ohos` prototype — 一个 GratingComponent 真渲染
3. 扩展到全 stimulus 类型 + 输入设备
4. 集成 psychopy 实验流程（Loop/Routine/Flow）

### 关键 URL
- 鸿蒙 XComponent OpenGL 原生渲染：需查鸿蒙官方文档
- psychopy visual.backends 源码：`electron/src/python/lib/psychopy/visual/backends/`
- 鸿蒙 OpenGL ES 3.0 能力：需查鸿蒙官方文档

---

## 路径 B — Qt for HarmonyOS 桌面应用（DevEco Studio CMake 交叉编译）

### 目标
在鸿蒙设备上跑桌面 Qt 应用（不是 psychopy，是其他 Qt 桌面软件）。

### 为什么不走 PyQt
PyQt 是 Qt 的 Python binding，鸿蒙要 PyQt 得先有 Qt + sip binding，链路长且无人验证。直接用 Qt C++ 源码交叉编译是华为官方推荐路径。

### 官方路径
1. **准备 OHOS SDK** — 含 `native` 工具链（clang）、CMake、Ninja、sysroot
2. **准备 Qt for HarmonyOS** — git clone `tqtc-qt5`（Qt 5.12.12/5.15.16）+ `ohos-clang` 平台 configure + make
3. **DevEco Studio CMake 工程** — `find_package(Qt5)` + `target_link_libraries(... Qt5::Core Qt5::Gui Qt5::Widgets)`
4. **运行时库打包** — `libqohos.so`（Qt OHOS QPA）+ `libQt5Core.so`/`libQt5Gui.so`/`libQt5Widgets.so` + 应用 .so 放进 `entry/libs/arm64-v8a/`
5. **binary-sign-tool 自签名** — `~/.harmonybrew/bin/binary-sign-tool sign -inFile libxxx.so -outFile libxxx.so -selfSign 1`

### 关键技术点
- `CMAKE_FIND_ROOT_PATH_MODE_PACKAGE BOTH` — OHOS toolchain 默认 `ONLY`，Qt 装 sysroot 外找不到，需临时放宽
- `libqohos.so` 是 Qt OHOS QPA 插件，对接鸿蒙 ArkUI 窗口系统，不走 X11
- DevEco Studio 是鸿蒙官方 IDE，打 HAP 包 + 安装运行

### 关键 URL
- Qt for HarmonyOS 交叉编译指南：https://wiki.qt.io/Qt_for_HarmonyOS/user_development_guide/deveco_cmake_guide_cross_compile_zh
- Qt for HarmonyOS 源码构建：https://wiki.qt.io/Qt_for_HarmonyOS/zh
- Build Qt for OpenHarmony 自动化构建工具：https://gitcode.com/qq_28312849/Build
- vcpkg-ohos 给鸿蒙编译 C/C++ 三方库：https://www.qt.io/zh-cn/blog/building-libraries-for-harmonyos-with-vcpkg
- Qt 开源软件适配鸿蒙 PC 实战：https://ai6s.net/6a13bec9662f9a54cb76d939.html

### 探索步骤
1. 在开发机装 OHOS SDK + Qt for HarmonyOS（用 Build 自动化工具一键编）
2. 跑通最小 Qt Widgets Demo（calculator 示例）在鸿蒙设备显示窗口
3. 用 vcpkg-ohos 装三方 C/C++ 库（zlib/boost/icu 等）
4. 移植目标 Qt 桌面应用到鸿蒙

---

## 两条路的区别

| | 路径 A（psychopy 鸿蒙原生 GUI） | 路径 B（Qt for HarmonyOS 桌面应用） |
|--|----------------------------------|-------------------------------------|
| 目标 | psychopy stimulus 真开窗给被试看 | 桌面 Qt 应用在鸿蒙跑 |
| 经过 Qt 吗 | 不经过，走鸿蒙 OpenGL ES + XComponent | 经过 Qt for HarmonyOS |
| 改 psychopy 源码吗 | 改，加 `visual.backends.ohos` | 不改 psychopy |
| 华为官方推荐 | 是（ArkUI 后端） | 是（Qt for HarmonyOS） |
| 工程量 | 大（写新 backend + 验证渲染 + 输入设备） | 中（用官方工具链 + Build 自动化） |
| 当前进度 | 未开始 | 未开始 |

---

## 探索日志

### 2026-07-15 22:52 — 文档创建
- 初始两条路规划完成
- PyQt/wx 交叉编译无收益结论已记 `CHANGELOG-AtomCode.md` 22:48 条目
- liaison 后端已真跑通（getAllComponents/writeScript），PyQt/wx mock 是死代码兜底
- 两条路都是将来真跑 GUI 实验的探索，不影响当前 liaison 后端工作

---

## 最终研究报告（2026-07-16）

> 整合三方证据（网络检索 + HarmonyBrew 实测 + �鸿蒙沙箱实测）的最终判断。前三节「新发现」来自另一开发机的检索材料，后两节是本机实测验证 + 据此的最终判断。

### 1. sip 交叉编译链真相

PyQt5 不是 Qt 库的直接 wrapper，它通过 sip 这个构建工具生成 Python binding 代码。在鸿蒙装 PyQt5 的 sip 链真相：

| 链节 | 实测/证据 | 堵点 |
|------|----------|------|
| **sip 工具** | ✅ 鸿蒙系统 Python `pip install sip` 可装 sip-6.15.3（`--dry-run` 验证） | sip 装上只是构建工具，不解决 Qt 库缺失 |
| **Qt5/6 源码树** | 要交叉编 `tqtc-qt5`/`tqtc-qt6` 出 `libQt5Core.so` 等 | 鸿蒙沙箱无 OHOS SDK sysroot，开发机才有 |
| **OHOS NDK** = OHOS SDK `native/` 工具链（clang + sysroot）| ❌ 设备上没装 | 交叉编要在开发机跑，非鸿蒙设备 |
| **OHOS 特定 patch** | StackOverflow 多报 `qprocess.sip: Q_PID is undefined` 等 sip 生成代码与 Qt 版本不匹配错 | 鸿蒙 Qt 分支版本号非标准，patch 量未知，社区无人验证过 |

**工期 2-4 周保守**，且产出 PyQt5 binding 调 `QApplication.exec()` 时走 ArkUI QPA 不走 X11 — psychopy GUI 代码还要适配。

### 2. 新发现 1 — Qt6.11 + vcpkg-ohos 已正式落地

**真**。Qt Group 在 HDC 2024 善布移植，2026-05 发布 vcpkg-ohos 分叉，支持 `arm64-ohos` triplet，Qt 6.11 引入 `QT_USE_VCPKG=ON` 配置选项。社区已有 Notepad–、NetTool、备忘录等开源项目。

但关键限定：
- **vcpkg-ohos 要在开发机跑**（需 `OHOS_SDK_ROOT` 指向 DevEco Studio SDK），不是鸿蒙设备上跑
- **输出是 .so 共享库**打包进 HAP 的 `entry/libs/arm64-v8a/`，由 ArkTS 加载 — 这是桌面 Qt 应用路径，**不是 PyQt**
- 社区项目（Notepad–、NetTool）是 **Qt C++ 应用**，不走 PyQt — PyQt sip 链官方没验证过

### 3. 新发现 2 — 鸿蒙 PC PyQt5 apt 教程

CSDN 博客（2026-07-14）展示在鸿蒙 PC 上 `apt install python3-pyqt5` + `pip3 install PyQt5` 完整流程。**真但前提严苛**：

- 教程明确写「仅适用于搭载 Linux 内核的鸿蒙设备」「需 X11 或 Wayland 图形服务支持」
- **本机实测**（鸿蒙沙箱）：`which apt apt-get dpkg` 全空、`find / -name Xwayland -o -name Xorg` 空、无 `/usr/bin/X*` — **本机不是那种鸿蒙 PC**
- 那种鸿蒙 PC（开发板/PC 版鸿蒙带 Linux 内核 + X11）才能走 apt 装 PyQt5，**沙箱型鸿蒙不行**

### 4. 新发现 3 — Qt for HarmonyOS 架构（QPA→XComponent，qtmain()）

**真**。这恰恰是**不走 PyQt** 的理由：
- QPA 插件通过 XComponent 渲染 = Qt 底层走 ArkUI，**不是 X11 桌面 Qt**
- 入口 `qtmain()` 而非 `main()` = C++ 应用编译为 `.so` 由 ArkTS 加载，不是标准桌面 exe
- PyQt 期望的是 X11 桌面 Qt API（`QApplication.exec()` 主框事件循环、`QDesktopServices.openUrl`、`wx.MessageDialog` 弹框），鸿蒙 Qt 的 QPA 走 ArkUI 后端这些 API 行为完全不同 — 要改 psychopy 源码适配

### 5. 本机实测验证表（鸿蒙沙箱）

| 项 | 命令 | 结果 | 含义 |
|----|------|------|------|
| sip 工具 | `python3 -c "import sip"` | `ModuleNotFoundError` | sip 需 pip 装，装上是构建工具非运行时 |
| pip 装 sip | `pip install sip --dry-run` | `sip-6.15.3` 可装 | sip 链可装，但不解决 Qt 库缺失 |
| apt 包管理器 | `which apt apt-get dpkg` | 全空 | 鸿蒙沙箱不是 Debian �系，CSDN apt 路径不通 |
| X11/Wayland | `find / -name Xwayland -o -name Xorg` | 空 | 鸿蒙沙箱无 X11/Wayland，PyQt 装上跑不出窗 |
| Qt 库 | `find / -name Qt5Config.cmake -o -name libQt5Core.so*` | 空 | 鸿蒙沙箱无 Qt5/6，sip 编 PyQt5 无 Qt 树可绑 |
| vcpkg | `which vcpkg` | 空（HarmonyBrew 有 vcpkg 名条） | vcpkg-ohos 要开发机跑，不是设备上 |

### 6. 三条路可行性矩阵 + 最终判断

| 路径 | 技术可行 | 鸿蒙沙箱实测 | 工期 | liaison 后端收益 | 真跑 GUI 实验收益 |
|------|---------|------------|------|----------------|------------------|
| **A. 鸿蒙 PC apt 装 PyQt5** | ✅ X11/Wayland 设备可 | ❌ 本机无 `apt`、无 `Xwayland`、无 `/usr/bin/X*` | 0 | 0 | 0（本机非 X11 鸿蒙 PC） |
| **B. Qt6.11 + vcpkg-ohos 交叉编 Qt，再 sip 编 PyQt5** | ✅ 官方支持 | ⚠️ 鸿蒙设备上无 OHOS SDK sysroot（开发机才有） | 2-4 周 | 0 | 霈改 psychopy 源码适配 ArkUI QPA |
| **C. 不装 PyQt/wx，保留 mock，走鸿蒙原生 OpenGL ES** | ✅ ArkUI XComponent | ✅ `libGLESv3.so` 鸿蒙原生 | 2-4 周 | 0 | ✅ 真跑 stimulus |

**最终判断**：

| 目标 | 推荐路径 | 理由 |
|------|---------|------|
| **liaison 后端**（getAllComponents/writeScript） | **保留 PyQt/wx mock** | liaison 后端真不调 GUI API，花 2-4 周编 PyQt 零收益。mock 是死代码兜底非逃避 |
| **真跑 psychopy GUI 实验**（开 stimulus 窗） | **路径 C — 鸿蒙原生 OpenGL ES** | 不经 Qt/PyQt，走 `libGLESv3.so` + ArkUI `XComponent`，psychopy `visual.backends.ohos` 新 backend。华为官方推荐路径 |
| **桌面 Qt 应用在鸿蒙跑**（非 psychopy） | **路径 B — Qt6.11 + vcpkg-ohos** | 官方路径，DevEco Studio CMake 交叉编，`binary-sign-tool` 自签。不是 PyQt |

**PyQt/wx 交叉编译到鸿蒙 — 技术上有路但 liaison 后端零收益 + 真跑 GUI 要改 psychopy 源码适配 ArkUI QPA。不走。**

### 关键 URL（供后续探索）
- Qt for HarmonyOS 交叉编译指南：https://wiki.qt.io/Qt_for_HarmonyOS/user_development_guide/deveco_cmake_guide_cross_compile_zh
- Qt for HarmonyOS 源码：https://wiki.qt.io/Qt_for_HarmonyOS/zh（`tqtc-qt5`/`tqtc-qt6` git clone + `ohos-clang` configure）
- 鸿蒙 PyQt 桌面应用开发（CSDN，前提 X11/Wayland）：https://blog.csdn.net/umut9/article/details/147840004
- Qt 开源软件适配鸿蒙 PC 实战：https://ai6s.net/6a13bec9662f9a54cb76d939.html
- Build Qt for OpenHarmony 自动化构建工具：https://gitcode.com/qq_28312849/Build
- vcpkg-ohos 给鸿蒙编译 C/C++ 三方库：https://www.qt.io/zh-cn/blog/building-libraries-for-harmonyos-with-vcpkg

---

## 运行环境要求（2026-07-16）

> 本软件跑 liaison Python 后端 + Electron 前端的完整环境要求。实测验证于鸿蒙沙箱 + HarmonyBrew。

### 鸿蒙系统 Python（后端真跑）

| 项 | 要求 | 实测路径 |
|----|------|---------|
| Python 版本 | 3.12+（psychopy 2025.2.4 要 3.10+，实测 3.12.8 OK）| `/data/service/hnp/python.org/python_3.12/bin/python3` |
| 鸿蒙官方 Python 包 | numpy/scipy/matplotlib/PIL/pandas/websockets/soundfile 预装 | 鸿蒙 `pypi.cnb.cool/OpenHarmonyPCDeveloper/pypi` 源 |
| `HOME` 环境变量 | psychopy preferences.py 用 `os.environ['HOME'] + '.psychopy3'` 构造 userPrefsDir（**不读 PSYCHOPY_HOME**），默认 `~` 鸿蒙沙箱拒绝写 | liaison_shim.py 设 `HOME` 到 `/data/storage/el2/base/cache/home` |
| `MPLCONFIGDIR` | matplotlib 缓存目录，沙箱可写 | liaison_shim.py 设到 `/data/storage/el2/base/cache/matplotlib` |
| `platform.system()` | psychopy 用它找 spec 文件（`platform.system() + '.spec'`），鸿蒙返 `'HarmonyOS'` 无对应 spec → prefsSpec 空 → validate 无默认 → `cfg['general']` KeyError `'general'` | liaison_shim.py monkey-patch 返 `'Linux'`（鸿蒙 POSIX 兼容，Linux.spec 适用） |
| `userPrefs.cfg` | psychopy preferences 首启要 8 个必需 section（general/app/coder/builder/hardware/piloting/connections/keyBindings），`restoreBadPrefs` 只打印不建 section | liaison_shim.py 预置最小 cfg 到 `$HOME/.psychopy3/` |
| `wx` mock | localization 用 `wx.Locale()` 读 locale 元数据，鸿蒙无 wx | liaison_shim.py `_mock_wx` 补全 Locale API（GetLocale/GetCanonicalName/GetSystemLanguage/GetLanguageInfo/IsAvailable） |
| `PyQt5/6` mock | visual.backends 顶层 `from PyQt5.QtCore import QObject`，鸿蒙无 PyQt | liaison_shim.py `_mock_pyqt5/6` GUI 兜底死代码（liaison 后端不真调） |
| `soundfile` | psychopy.tools.audiotools `import soundfile as sf`，鸿蒙缺 `libsndfile.so` C 库 → OSError → microphone/camera 组件 import 失败 → getAllComponents 报错 | **不 stub**，用 HarmonyBrew libsndfile 真库 + `LD_LIBRARY_PATH` |

### HarmonyBrew（C 库 + Node + 签名工具）

| 项 | 要求 | 实测路径 |
|----|------|---------|
| HarmonyBrew 本体 | 类 Homebrew 源码构建包管理器 | `~/.harmonybrew/bin/brew` |
| **libsndfile** | psychopy soundfile 真库依赖 | `brew install libsndfile` → `~/.harmonybrew/Cellar/libsndfile/1.2.2_1/lib/libsndfile.so` |
| **node**（构建用）| 系统 node v24 坏（native crash exit 133），必须用 HB 的 | `~/.harmonybrew/Cellar/node@24/24.17.0/bin/node` |
| **binary-sign-tool** | .so 自签名工具（将来交叉编 Qt 用） | `~/.harmonybrew/bin/binary-sign-tool` |
| vcpkg-ohos | C/C++ 三方库交叉编（将来用，本轮不触） | 开发机跑，非设备 |

### 环境变量（父进程 spawn 时就要设好）

harmony-python.js `getPythonEnv()` 生成。**关键**：子进程内 `os.environ` 设 `LD_LIBRARY_PATH` 太晚 — linker 在 Python 启动时已搜完库路径，必须在父进程 spawn 时就设好。

| 变量 | 值 | 作用 |
|-----|-----|------|
| `LD_LIBRARY_PATH` | `~/.harmonybrew/Cellar/libsndfile/1.2.2_1/lib` + `~/.harmonybrew/lib` | 让 ctypes ffi.dlopen 真加载 libsndfile.so |
| `PSYCHOPY_NO_GUI` | `"1"` | psychopy 走非 GUI 分支 |
| `MPLBACKEND` | `"Agg"` | matplotlib 无窗渲染 |
| `PYTHONPATH` | 鸿蒙 site-packages + bundled lib | psychopy 包路径 |
| `OPENBLAS_NUM_THREADS` / `OMP_NUM_THREADS` / `MKL_NUM_THREADS` / `NUMEXPR_NUM_THREADS` | `"1"` | 防 OpenBLAS 多线程触发 SECCOMP |
| `OPENBLAS_MAIN_FREE` | `"1"` | 同上 |

### liaison_shim.py 顺序（import psychopy 前）

1. 设 `HOME` / `MPLCONFIGDIR` 到沙箱可写目录
2. monkey-patch `platform.system()→Linux`
3. 预置最小 `userPrefs.cfg`（8 个必需 section）
4. `_mock_pyqt5/6` + `_mock_wx`（GUI 兜底死代码）
5. 设 `LD_LIBRARY_PATH` 指向 HarmonyBrew libsndfile（兜底，真生效在父进程）
6. `import psychopy`

### 构建工具链

| 项 | 要求 |
|----|------|
| 前端构建 | HarmonyBrew node v24.17.0 + `node_modules/vite/bin/vite.js build` |
| 系统node | **不能用** v24.13.0 native crash |
| ast-grep | 本机没装，用 grep + python ast.parse + HB node --check 组合 |
| Python 语法验证 | `python3 -c "import ast; ast.parse(open('file').read())"` |
| JS 语法验证 | `HB node --check file` |

### 副本同步（改后必做）

改 `web_engine/src/main/resources/resfile/resources/app/electron/src/` 下文件后，同步到：
- `hap_inspect/resources/...`
- `electron/build/default/intermediates/...`
- `Documents/ohos_electron_hap-main_Psychopy_v0.1.6/` 下 web_engine + electron/build + resources

liaison_shim.py 副本含根目录 + Documents 各路径，共 7 副本。

### 将来真跑 GUI 实验要的（本轮不触）

| 项 | 路径 |
|----|------|
| OpenGL ES 3.0 | 鸿蒙 `libGLESv3.so` 原生 |
| ArkUI XComponent | 嵌原生 OpenGL 渲染 |
| OHOS SDK sysroot | 开发机才有，设备上无 |
| Qt6.11 + vcpkg-ohos | 开发机交叉编，输出 .so 打包进 HAP |

---
