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
