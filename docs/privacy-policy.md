# PsychoPy Studio OH 隐私政策

**最后更新日期：** 2026-07-20  
**开发者：** A9iska  
**应用名称：** PsychoPy Studio OH

## 概述

PsychoPy Studio OH 是开源软件 PsychoPy（© Open Science Tools Ltd, Jonathan Peirce）的鸿蒙系统（HarmonyOS）移植版本。本应用是一个心理学实验构建与运行工具，本隐私政策旨在说明本应用如何处理用户数据。

## 信息收集

**本应用不收集、不存储、不上传任何用户个人信息。**

本应用是一个本地运行的桌面软件，所有功能均在本地设备上完成：

- **实验数据**：用户创建的实验文件（.psyexp, .py, .js）、实验运行结果（.csv, .psydat）仅存储在用户指定的本地目录中，不会自动上传到任何服务器。
- **Python 运行环境**：本应用调用设备上的系统 Python 解释器执行实验脚本，该过程完全在本地完成。
- **PsychoJS 在线实验**：当用户在设备浏览器中运行实验时，实验资源通过本地 HTTP 服务提供，浏览器仅通过 localhost/WiFi IP 访问本地文件，不经过外部服务器。

## 权限说明

本应用申请的以下系统权限均为功能所需，不会用于收集个人信息：

| 权限 | 用途 |
|------|------|
| 互联网访问 (INTERNET) | 用于本地 HTTP 服务器（实验运行时）和可选的 Pavlovia 在线实验同步 |
| 麦克风 (MICROPHONE) | 心理学实验中声音刺激录音功能（用户可选开启） |
| 相机 (CAMERA) | 心理学实验中眼动追踪/面部检测功能（用户可选开启） |
| 位置信息 (LOCATION) | 实验地理标记功能（用户可选开启） |
| 文件读写 | 保存/加载实验文件和实验数据 |
| 蓝牙 (BLUETOOTH) | 连接外部实验设备（如反应盒） |
| 剪贴板 | 复制实验参数/粘贴数据 |

## 第三方服务

本应用可能涉及以下第三方服务（均为用户主动使用）：

- **Pavlovia**（pavlovia.org）：用户可选择登录 Pavlovia 账号以在线同步实验项目。此功能使用 Open Science Tools Ltd 提供的服务，其隐私政策请参阅 pavlovia.org 隐私声明。
- **Pip / PyPI**：通过 pip 安装 Python 包依赖时，从 Python Package Index (pypi.org) 下载软件包。此为 Python 生态系统的标准行为。

## 数据安全

由于所有数据均存储在用户设备本地，数据安全依赖于用户设备自身的安全措施。建议用户：
- 定期备份重要实验文件和数据
- 保护设备解锁密码/生物识别信息

## 开源与许可

PsychoPy Studio OH 基于开源软件 [PsychoPy](https://github.com/psychopy/psychopy)（GPLv3 许可协议）进行鸿蒙系统适配。本项目源代码可在以下地址获取：
- [https://gitcode.com/A9iska/psychopy-oh](https://gitcode.com/A9iska/psychopy-oh)

## 联系我们

如有任何关于隐私政策的问题，请通过以下方式联系：
- 项目仓库 Issues: [https://gitcode.com/A9iska/psychopy-oh/issues](https://gitcode.com/A9iska/psychopy-oh/issues)

## 政策更新

本隐私政策可能会因应用功能更新或法律法规变化而修改。更新后的政策将继续通过项目仓库公示。

---

**注：本隐私政策中文版本与英文版本具有同等效力。**
