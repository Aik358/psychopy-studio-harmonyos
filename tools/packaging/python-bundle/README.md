# python-bundle — 包内自包含 Python 前缀

把 Python 解释器 + 标准库 + 三方包整体打进 HAP 的 `resources/python/`，打包时统一签名。
这是 PsychoPy Studio 鸿蒙版的**默认模式**：零系统足迹、确定性、审核友好。

## 目录结构（对应 HAP 内 `resources/python/`）

```
python-bundle/
├── bin/
│   └── python3.12            # 鸿蒙 aarch64 解释器（从 HNP / ohos-python 取得）
├── lib/
│   └── python3.12/
│       ├── libpython3.12.so  # 运行时库
│       └── site-packages/    # 纯 Python 包 + 已自签的 aarch64 原生包
└── BINARIES_TO_SIGN.txt      # 需要 aarch64 原生版并自签的包清单（生成于 prepare 阶段）
```

## 两种运行模式（见 harmony-python.js）

| 模式 | 触发 | Python 来源 | 用途 |
|------|------|-------------|------|
| **bundle（默认）** | 包内 python 存在 | HAP 内 `resources/python/bin/python3.12` | 发布版 / 审核友好 |
| **dev（开发）** | 包内 python 缺失 或 `PSYCHOPY_MODE=dev` | 系统 HNP `/data/service/hnp/python.org/python_3.12` | 本机预览，无需先背 300MB 构建 |

## 构建步骤（详见 ../README.md）

1. `extract_deps.py` 从 Windows 源提取依赖清单
2. `prepare_bundle.py` 复制纯 Python 包、列出原生包
3. 在鸿蒙设备获取 aarch64 原生轮子放入 `site-packages`
4. `sign_bundle.sh` 递归自签所有 `.so`
5. 整个 `python-bundle/` 作为 `resources/python/` 打进 HAP
