// ★ 共享文件路径：三个视图读写同一个文件，实现文件继承
// 转接层核心：HTTP 整页重载下 JS 内存 $state 会丢，
// 必须落 localStorage，重载后从 localStorage 恢复，才能跨视图保文件。
const PERSIST_KEY = 'psychopy.currentFile.v1';
const ACTIVE_VIEW_KEY = 'psychopy.activeView.v1';

function _readPersist() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
function _writePersist(obj) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(PERSIST_KEY, JSON.stringify(obj)); } catch (_) {}
}

// 启动时从 localStorage 恢复（HTTP 重载后这一步把文件救回来）
const _restored = _readPersist() || {};
export let currentFile = $state({
  file: _restored.file ?? null,          // 完整文件路径字符串
  name: _restored.name ?? null,          // 文件名
  ext: _restored.ext ?? null,            // 扩展名 (.psyexp / .py / .psyrun)
  source: _restored.source ?? null       // 来源视图: "builder" | "coder" | "runner" | "openIn"
})

// ★ $effect：currentFile 任何变更自动 flush 到 localStorage
// 放在模块顶层保证三视图任一导入此模块时就挂上这个同步
if (typeof window !== 'undefined') {
  try {
    $effect.root(() => {
      $effect(() => {
        const snap = {
          file: currentFile.file,
          name: currentFile.name,
          ext: currentFile.ext,
          source: currentFile.source
        };
        _writePersist(snap);
      });
    });
  } catch (_) { /* SSR / 非 Svelte5 运行时静默 */ }
}

// ★ 上边栏 activeView 同样持久化，切窗口前后读同一值，保证上边栏不跳
// Svelte5 不许 export 重赋值的 $state，所以状态藏内部，对外只给读写函数
const _restoredView = (typeof localStorage !== 'undefined' && localStorage.getItem(ACTIVE_VIEW_KEY)) || 'builder';
let _activeView = $state(_restoredView);
export function getActiveView() { return _activeView; }
export function setActiveView(v) {
  _activeView = v;
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(ACTIVE_VIEW_KEY, v); } catch (_) {}
  }
}

// ★ 切窗口前调用：把待切目标视图 + 当前文件一次性落盘
// views.svelte.js 的 showWindow/openIn 在 navigate 前调这个，
// 保证 HTTP 重载后 target 视图 mount 时能从 localStorage 读回文件。
// ★★ source 字段记的是"文件来源视图"（文件从哪个视图产出），不是"目标视图"。
// 这样 consumeCurrentFile('runner') 判 source==='runner' 才真是"runner 自己产的自回环"，
// 不会把"builder 切到 runner"误判成自回环（source 应是 'builder' 不是 'runner'）。
export function flushBeforeNavigate(targetView, fileObj) {
  if (fileObj) {
    currentFile.file = fileObj.file ?? null;
    currentFile.name = fileObj.name ?? null;
    currentFile.ext = fileObj.ext ?? null;
    // source 用 fileObj.source（调用方传的来源视图），没传则保留现值，不默认设成 targetView
    currentFile.source = fileObj.source ?? currentFile.source ?? null;
  }
  if (targetView) setActiveView(targetView);
}

// ★ target 视图 mount 时调用：读出 currentFile 并按需清 source（避免回环）
// 返回 null 表示没有待继承文件
export function consumeCurrentFile(forView) {
  if (!currentFile.file) return null;
  // 同一视图自己产生的文件不回环消费
  if (currentFile.source === forView) return null;
  return {
    file: currentFile.file,
    name: currentFile.name,
    ext: currentFile.ext,
    source: currentFile.source
  };
}

export const store = $state({
  activeView: _restoredView,
  builderState: {
    saved: false,
    experimentJSON: null,
    file: null,
    routineName: null,
    readmeShown: false,
    project: null
  },
  coderState: {
    saved: false,
    pages: null,
    tab: 0
  },
  runnerState: {
    saved: false,
    runlist: null,
    selection: null,
    tab: 'alerts',
    output: null
  },
  generatedCode: {
    python: null,
    js: null,
    experimentJSON: null,
    sourceFile: null
  }
})

export let coderState = $state({
  saved: false,
  pages: null,
  tab: 0
})

export let runnerState = $state({
  saved: false,
  runlist: null,
  selection: null,
  tab: 'alerts',
  output: null
})

export let generatedCode = $state({
  python: null,
  js: null,
  experimentJSON: null,
  sourceFile: null
})
