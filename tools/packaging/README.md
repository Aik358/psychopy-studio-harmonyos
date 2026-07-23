# PsychoPy Studio 鸿蒙版 — Python 打包工具

把 Python 运行时整体打进 HAP 的 `resources/python/`，打包时统一签名。
这是发布版的**默认模式**：零系统足迹、确定性、审核友好。

## 两种运行模式（与 `harmony-python.js` 对齐）

| 模式 | 触发 | Python 来源 | 用途 |
|------|------|-------------|------|
| **bundle（默认）** | 包内 `resources/python/bin/python3.12` 存在 | HAP 内自包含前缀 | 发布版 / 审核友好 |
| **dev（开发）** | 包内 python 缺失 或 `PSYCHOPY_MODE=dev` | 系统 HNP `/data/service/hnp/python.org/python_3.12` | 本机预览，无需先背 300MB 构建 |

> 软件原有的「每次打开自检系统 Python」环节，在鸿蒙端天然对应 **dev 模式**：
> 自检时走系统 HNP python（brew 已签名包 + `ohos-pip-autosign` 自签安装）。

## 工作流

```
Windows 源 (C:\Program Files\PsychoPy Studio\app.asar)
        │  extract_deps.py --asar / --conda-env
        ▼
requirements-bundle.txt + NATIVE_PACKAGES.txt
        │  prepare_bundle.py --source-site-packages <windows sp>
        ▼
python-bundle/  (纯 Python 包已复制；原生包列入 BINARIES_TO_SIGN.txt)
        │  在鸿蒙设备获取 aarch64 原生轮子 → 放入 site-packages
        ▼
sign_bundle.sh  <bundle>        # 设备端递归自签所有 .so
        │
        ▼
python-bundle/ 作为 HAP 的 resources/python/ 打包
        │
        ▼
harmony-python.js 默认走包内 python；缺失则回退 dev
```

## 文件

- `extract_deps.py` — 从被移植端(Windows 官方)提取依赖清单
- `prepare_bundle.py` — 组织 bundle 目录 + 生成待签名清单
- `sign_bundle.sh` — 设备端递归自签 `.so`
- `python-bundle/` — bundle 目录模板（结构见其内 README）
- `requirements-bundle.txt` — 当前依赖清单（基于 conda 环境，asar 提取更权威）
- `BINARIES_TO_SIGN.txt` — 需 aarch64 原生版并自签的包

## 关键约束（来自 HarmonyOS NEXT 代码签名规则）

- 应用内所有 `.so` 必须随 HAP 签名，不能运行时从用户目录加载。
- 自签名 `binary-sign-tool --selfSign` 仅打 `flags=0x10` 占位标记，系统放行，**无需正式证书**。
- Windows 的 `.pyd` 不能用于鸿蒙，原生包必须替换为 aarch64 版。
