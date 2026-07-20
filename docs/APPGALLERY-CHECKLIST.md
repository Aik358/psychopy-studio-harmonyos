# 华为应用市场上架清单

## 当前进度

- [x] 包名修改: `com.a9iska.psychopy`
- [x] 厂商: `A9iska`
- [x] 版本: `1.0.1` (1000001)
- [x] 应用名称: `PsychoPy Studio OH`
- [x] 中文资源完善
- [x] 多尺寸图标生成
- [x] 隐私政策文档
- [x] 版权致谢文档
- [ ] 生成 Release 签名证书
- [ ] 应用截图（3-5 张，1280x720 以上，16:9）
- [ ] 备案
- [ ] 软件著作权
- [ ] 构建 Release .app 包
- [ ] AGC 后台创建应用并提审

## AGC 后台填写内容

### 应用名称
- 中文: PsychoPy Studio OH
- 英文: PsychoPy Studio OH

### 包名
`com.a9iska.psychopy`

### 简短介绍 (< 80 字符)
基于 Open Science Tools 的 PsychoPy 移植的鸿蒙版心理学实验构建工具。

### 详细介绍
PsychoPy Studio OH 是一款专业的心理学实验构建与运行工具，基于开源软件 PsychoPy (2026.1.2) 进行鸿蒙系统适配。

功能特色：
- Builder 可视化实验构建：拖拽式组件（文本、图片、声音、键盘响应等）
- 一键生成 Python 脚本和 JavaScript（PsychoJS）代码
- 浏览器内运行实验，无需额外安装
- 支持实验条件文件（.xlsx / .csv）
- 完整的 Python 实验执行环境（基于系统 Python 3.12）

适用场景：
- 心理学研究实验设计
- 认知神经科学刺激呈现
- 心理测量与问卷调查
- 教学演示与课堂实验

开源许可：基于 GPLv3 协议，源代码完全开放
项目地址：https://gitcode.com/A9iska/psychopy-oh

### 关键词
心理学, 实验, PsychoPy, 刺激呈现, 认知, 问卷, 实验设计, 心理测量, 开源, 科学研究

### 应用分类
教育 > 科研工具 / 工具 > 学术工具

### 隐私政策 URL
（需上传到公网可访问的地址，如 GitHub Pages）

### 权限说明
| 权限 | 场景说明 |
|------|---------|
| internet | 本地 HTTP 服务器运行实验、Pavlovia 在线同步 |
| microphone | 心理学实验录音 |
| camera | 眼动追踪/面部检测实验 |
| location | 实验地理标记 |
| file read/write | 创建/保存实验文件和数据 |
| bluetooth | 连接外部实验设备 |
| clipboard | 复制粘贴实验参数 |
| privacy_window | 隐私窗口保护 |

### 年龄分级
18+

## Release 签名步骤

1. DevEco Studio → Build → Generate Key and CSR
   - 密钥库: `psychopy_release.p12`（8位以上密码）
   - 别名: `releaseKey`
   - 全英文信息，国家选 CN
   - 生成 `psychopy_release.csr`

2. AGC → 证书管理 → 新增证书 → 上传 `.csr` → 下载 `.cer`

3. AGC → Profile → 添加 → 选择设备和证书 → 下载 `.p7b`

4. DevEco Studio → Project Structure → Signing Configs → 新增 `release`
   - 导入 `.p12`, `.cer`, `.p7b`
   - 更新 `build-profile.json5` 中 release 签名的占位路径

5. Build → Build APP(s) → 选择 release 模式

## 应用截图要求

- 数量: 3-5 张
- 比例: 16:9
- 分辨率: 至少 1280×720
- 建议内容:
  1. Builder 界面（组件面板 + 实验流程）
  2. Coder 代码编辑界面
  3. 运行中的实验（含刺激呈现效果）
  4. 设置界面（Python 环境配置）
  5. 数据输出（如 CSV 结果预览）

## 常见驳回原因

1. 隐私政策不可访问/内容不完整
2. 权限未逐条说明使用场景
3. 应用截图与实际功能不符
4. 包名与 AGC 后台不一致
5. 软著缺失
6. 测试残留（调试弹窗/测试域名/日志泄露）
7. 应用不稳定（闪退/卡顿）
8. 素材尺寸不合规
