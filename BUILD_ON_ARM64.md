# HarmonyOS ARM64 本机构建指南

## 概述

本指南记录了在 HarmonyOS ARM64（aarch64）设备上成功自构建 PsychoPy Studio 前端（`dist/`）的全流程。通过本指南，你可以在鸿蒙设备上独立完成前端编译，无需依赖 x86 构建机。

**适用设备**：HarmonyOS 5.0+ / HongMeng Kernel 1.12+，arm64 架构

---

## 前提条件

- HarmonyOS 设备（已安装 harmonybrew）
- Node.js v26.3.1（通过 harmonybrew 安装）
- DevEco Studio / hvigor 工具链
- 网络连接（用于 npm 下载依赖）

---

## 步骤 1：准备环境

### 1.1 确认 Node.js

```bash
# 使用 harmonybrew 的 Node.js（系统 Node.js 有 __errno_location bug）
export NODE="/storage/Users/currentUser/.harmonybrew/Cellar/node/26.3.1/bin/node"
export NPM_CLI="/storage/Users/currentUser/.harmonybrew/Cellar/node/26.3.1/lib/node_modules/npm/bin/npm-cli.js"

$NODE --version
# 应输出: v26.3.1
```

> **注意**：不要使用 `/data/service/hnp/bin/node`（v24.13.0），它有 `__errno_location` 断言崩溃 bug。

### 1.2 确认 binary-sign-tool

```bash
/storage/Users/currentUser/.harmonybrew/bin/binary-sign-tool
# 应显示 USAGE 信息
```

`binary-sign-tool` 用于给 Node.js 原生 `.node` addon 文件添加 HarmonyOS 代码签名，绕过系统安全策略对 `dlopen` 的限制。

---

## 步骤 2：配置前端项目

```bash
cd web_engine/src/main/resources/resfile/resources/app
```

### 2.1 修复 package.json

HarmonyOS 被 npm 检测为 `openharmony` 系统，而 `package.json` 的 `"os"` 字段限制为 `darwin,linux,win32`。需要移除该限制：

```bash
$NODE -e "
const pkg = require('./package.json');
delete pkg.os;
delete pkg.optionalDependencies;
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ os 限制已移除');
"
```

### 2.2 确保 static/ 目录存在

```bash
ls static/ 2>/dev/null || echo "static/ 缺失，需要从源仓库复制"
```

如果缺失，从 psychopy-oh 仓库的 `web_engine/.../resources/app/static/` 复制。

---

## 步骤 3：安装依赖

```bash
cd web_engine/src/main/resources/resfile/resources/app

# 用 node 直跑 npm-cli.js（绕过 npm 二进制文件的崩溃 bug）
$NODE "$NPM_CLI" install
```

预期输出：
```
added 198 packages in 4s
```

---

## 步骤 4：签名 Native Binding

npm 安装的某些原生 binding 缺少 HarmonyOS 代码签名，导致 `dlopen` 被系统拦截（`Permission denied`）。

### 4.1 签名 rolldown binding

```bash
# 检查 binding 是否存在
ls node_modules/@rolldown/binding-openharmony-arm64/

# 签名
/storage/Users/currentUser/.harmonybrew/bin/binary-sign-tool sign \
  -selfSign 1 \
  -inFile node_modules/@rolldown/binding-openharmony-arm64/rolldown-binding.openharmony-arm64.node \
  -outFile node_modules/@rolldown/binding-openharmony-arm64/rolldown-binding.openharmony-arm64.node.signed \
  -signAlg SHA256withECDSA

# 替换为签名版本
mv node_modules/@rolldown/binding-openharmony-arm64/rolldown-binding.openharmony-arm64.node \
   node_modules/@rolldown/binding-openharmony-arm64/rolldown-binding.openharmony-arm64.node.unsigned
cp node_modules/@rolldown/binding-openharmony-arm64/rolldown-binding.openharmony-arm64.node.signed \
   node_modules/@rolldown/binding-openharmony-arm64/rolldown-binding.openharmony-arm64.node
chmod +x node_modules/@rolldown/binding-openharmony-arm64/rolldown-binding.openharmony-arm64.node
```

> **原理**：`binary-sign-tool sign -selfSign 1` 会向 ELF 文件的代码段添加 HarmonyOS 兼容的签名信息，使系统安全策略允许该文件被动态加载。

### 4.2 处理 lightningcss（替换为 WASM 版本）

`lightningcss` 原生 binding 依赖 `libgcc_s.so.1`，而 HarmonyOS 使用 clang/LLVM 不包含此库。解决方案是使用 WASM 版本：

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

# 替换 lightningcss 入口为 WASM 版本
cp node_modules/lightningcss/node/index.js node_modules/lightningcss/node/index.js.bak
cat > node_modules/lightningcss/node/index.js << 'EOF'
const wasm = require('lightningcss-wasm');
module.exports = wasm;
EOF

# 验证
$NODE --permission --allow-addons --allow-fs-read=* -e "
try {
  require('lightningcss');
  console.log('✅ lightningcss WASM 加载成功');
} catch(e) { console.log('❌', e.message); }
"
```

---

## 步骤 5：构建前端

### 5.1 构建命令

```bash
$NODE \
  --permission \
  --allow-addons \
  --allow-fs-read=* \
  --allow-fs-write=* \
  --allow-child-process \
  --allow-worker \
  ./node_modules/.bin/vite build
```

> **权限标志说明**：
> - `--permission`：启用 Node.js 权限模型
> - `--allow-addons`：允许加载原生 addon（已签名的 rolldown binding）
> - `--allow-fs-read=*` / `--allow-fs-write=*`：放开文件读写
> - `--allow-child-process`：允许子进程（CSS 等处理）
> - `--allow-worker`：允许 Worker 线程（SvelteKit 编译需要）

### 5.2 预期输出

```
✓ 668 modules transformed.
✓ built in 10.50s
Wrote site to "./dist"
✔ done
```

构建产物位于 `dist/` 目录，约 9.7MB。

---

## 步骤 6：构建 HAP

```bash
# 返回项目根目录
cd ../../../../../../../..

# 清理并构建 HAP
hvigorw clean --no-daemon
hvigorw --mode module -p module=electron@default,web_engine@default -p product=default -p buildMode=debug assembleHap --no-daemon
```

---

## 故障排除

### Node.js 崩溃：`Check failed: 12 == (*__errno_location())`

**原因**：HarmonyOS HongMeng 内核的 `__errno_location` 实现与 glibc 不兼容。

**解决**：使用 harmonybrew 编译的 Node.js v26.3.1（`--dest-os=openharmony --partly-static` 编译参数）。

### npm install 失败：`EBADPLATFORM`

**原因**：npm 检测到 `openharmony` 系统，但包限制为 `darwin/linux/win32`。

**解决**：删除 `package.json` 中的 `"os"` 字段，或用 `node npm-cli.js` 直跑。

### dlopen 失败：`Permission denied`

**原因**：HarmonyOS 安全策略阻止加载未签名的 ELF 共享库。

**解决**：用 `binary-sign-tool sign -selfSign 1` 签名 `.node` 文件。

### dlopen 失败：`Error loading shared library libgcc_s.so.1`

**原因**：HarmonyOS 使用 clang/LLVM，不包含 GCC 运行时库。

**解决**：将对应 native binding 替换为 WASM 版本（如 `lightningcss-wasm`）。

### Access to this API has been restricted

**原因**：Node.js 权限模型未开放对应能力。

**解决**：添加对应的 `--allow-*` 参数。

---

## 技术原理

### 为什么需要签名 Native Addon

HarmonyOS 的安全框架要求在系统加载动态共享库（`dlopen`）时，库文件必须包含有效的代码签名。未经签名的 `.node` 文件会被 `ERR_DLOPEN_FAILED` 拦截。

`binary-sign-tool sign -selfSign 1` 会在 ELF 文件的 `NOTE` 段添加 HarmonyOS 兼容的签名元数据，满足系统的安全检查。

### WASM 回退方案

对于 `libgcc_s.so.1` 依赖问题（如 `lightningcss`），WASM（WebAssembly）版本是理想的替代方案。WASM 二进制完全自包含，不依赖任何系统共享库，可以在任何支持 WASM 的运行时中加载。

---

## 参考

- [Harmonybrew 文档：编译 Node.js addon](https://atomgit.com/Harmonybrew/docs/blob/main/zh-CN/user/featured-packages.md)
- [binary-sign-tool 使用方法](https://atomgit.com/Harmonybrew/docs)
- [lightningcss-wasm](https://www.npmjs.com/package/lightningcss-wasm)
