# HarmonyBrew 构建执行（HarmonyBrew Build Runner）

用 HarmonyBrew 自带的 Node 运行前端构建（vite build / svelte-check / 任意 node 脚本），避开系统 node 二进制在本机会 native crash 的坑。

## 何时使用

- 用户说「用 HarmonyBrew 跑构建」「HarmonyBrew vite build」「构建前端」
- 在 psychopy-oh / ohos_electron_hap / PsyOH 这类项目里要构建前端 `dist/`
- 任何需要在本机跑 `node` / `vite` / `npm` / `svelte-check` 但系统 node 崩的情况

## ⚠️ 致命坑：系统 node 会 crash，绝不能用

```
$ node --version
v24.13.0

$ node --check index.cjs
Fatal error in , line 0
Check failed: 12 == (*__errno_location()).
Trace/breakpoint trap (core dumped)   [exit code 133]
```

**系统 PATH 里的 `node`（v24.13.0）在本机是坏的**——任何 `node` 调用都 native crash，不是代码语法问题。表现为 `Trace/breakpoint trap (core dumped)` exit 133。**绝不能用** `node ...`、`npx ...`、`npm run build` 这类依赖系统 node 的命令。

## 正解：用 harmonybrew Cellar 里 node 26.3.1

harmonybrew 装了 node 但 `~/.harmonybrew/bin/` 里**没链上 node**（只有 npm/npx），要直接从 Cellar 取真实二进制：

```bash
HB_NODE="$HOME/.harmonybrew/Cellar/node/26.3.1/bin/node"
"$HB_NODE" --version   # → v26.3.1，能跑
```

可用版本（取最新那个）：
- `~/.harmonybrew/Cellar/node/26.3.1/bin/node` ✅ 实测可用
- `~/.harmonybrew/Cellar/node@24/24.17.0/bin/node`（备选）

**动态找最新**（避免版本升级后路径失效）：
```bash
HB_NODE="$(find "$HOME/.harmonybrew/Cellar/node" "$HOME/.harmonybrew/Cellar/node@24" -name node -type f 2>/dev/null | sort -V | tail -1)"
```

并把 node 的 bin 目录塞到 PATH 前面，这样 `npm`/`npx` 也能用对的 node：
```bash
export PATH="$(dirname "$HB_NODE"):$PATH"
```

## 标准 vite build 流程（已验证）

psychopy-oh / ohos_electron_hap 前端在 `web_engine/src/main/resources/resfile/resources/app/`，用 `@sveltejs/adapter-static` 输出到 `./dist`（正是 electron HTTP server `127.0.0.1:8003` 加载的目录）。

```bash
HB_NODE="$HOME/.harmonybrew/Cellar/node/26.3.1/bin/node"
cd <前端根目录，含 node_modules 和 vite.config>
PATH="$(dirname "$HB_NODE"):$PATH" "$HB_NODE" node_modules/vite/bin/vite.js build
```

**timeout 设 300s**（首次构建含 svelte 预渲染，8-60s 不等）。

成功标志：
```
✓ built in X.Xs
> Using @sveltejs/adapter-static
  Wrote site to "./dist"
  ✔ done
```

## 常见构建失败 → 修法

### Svelte 5 `state_invalid_export`

```
Cannot export state from a module if it is reassigned.
export let activeView = $state(...);
```

**根因**：Svelte 5 不允许 export 后又被重赋值的 `$state`。
**修法**：状态藏内部，对外只给读写函数：
```js
// 改前（违规）
export let activeView = $state(x);
export function setActiveView(v) { activeView = v; }

// 改后（合规）
let _activeView = $state(x);
export function getActiveView() { return _activeView; }
export function setActiveView(v) { _activeView = v; }
```
注意：只 mutate 属性不重赋值本体的 `$state` 对象可以 export（如 `export let currentFile = $state({...})` 只改 `currentFile.file = ...` 不违规）。

### `package.json` 没有 scripts 字段

psychopy-oh 前端 `package.json` 无 `scripts`，不能 `npm run build`。直接调 vite CLI：`node_modules/vite/bin/vite.js build`。

## 语法检查（构建前快验）

改完 JS/cjs 先用 `node --check` 快验语法（用 HB_NODE 不是系统 node）：

```bash
HB_NODE="$HOME/.harmonybrew/Cellar/node/26.3.1/bin/node"
for f in <改过的 .js/.cjs 文件>; do
  "$HB_NODE" --check "$f" && echo "OK: $f" || echo "ERR: $f"
done
```

`.svelte` 文件 `node --check` 不适用（含模板），改用括号配平检查或直接跑 vite build。

## 构建产物验收

构建完确认三窗口入口 + 改动真进了 bundle：

```bash
ls dist/builder/index.html dist/coder/index.html dist/runner/index.html
# 改动常量（localStorage key、字符串字面量）能搜到就说明进了产物
grep -rIl "我的常量字符串" dist/_app/
```

minify 会重命名函数名，所以**搜字符串常量**（localStorage key、错误信息字面量）不搜函数名。

## 不要做

- ❌ 用系统 `node`/`npx`/`npm`（v24 会 crash）
- ❌ `npm run build`（本前端 package.json 无 scripts）
- ❌ 全量 build 验证语法——改一个文件用 `node --check` 快得多
- ❌ 假定 harmonybrew bin 链了 node——它没链，必须从 Cellar 取
