const { ipcRenderer, contextBridge, webUtils } = require('electron');


// details about Electron process
const electron = {
  windows: {
    new: (target) => ipcRenderer.invoke("electron.windows.new", target).then(resp => resp),
    get: (target) => ipcRenderer.invoke("electron.windows.get", target).then(resp => resp),
    send: (id, tag, data) => ipcRenderer.invoke("electron.windows.send", id, tag, data).then(resp => resp),
    emit: (tag, data) => ipcRenderer.send(tag, data),
    listen: (tag, lsnr) => ipcRenderer.on(tag, lsnr),
    focus: (id) => ipcRenderer.invoke("electron.windows.focus", id).then(resp => resp),
    devtools: (id) => ipcRenderer.invoke("electron.windows.devtools", id).then(resp => resp),
    close: (id) => ipcRenderer.invoke("electron.windows.close", id).then(resp => resp),
    minimize: (id) => ipcRenderer.invoke("electron.windows.minimize", id).then(resp => resp),
    maximize: (id) => ipcRenderer.invoke("electron.windows.maximize", id).then(resp => resp),
    navigate: (target) => ipcRenderer.invoke("electron.windows.navigate", target).then(resp => resp),
    state: {
      save: (key, data) => ipcRenderer.invoke("electron.windows.state.save", key, data).then(resp => resp),
      load: (key) => ipcRenderer.invoke("electron.windows.state.load", key).then(resp => resp),
    },
  },
  paths: {
    getPathForFile: (file) => webUtils.getPathForFile(file), 
    documents: () => ipcRenderer.invoke("electron.paths.documents").then(resp => resp),
    user: () => ipcRenderer.invoke("electron.paths.user").then(resp => resp),
    devices: () => ipcRenderer.invoke("electron.paths.devices").then(resp => resp),
    prefs: () => ipcRenderer.invoke("electron.paths.prefs").then(resp => resp),
    pavlovia: {
      dir: () => ipcRenderer.invoke("electron.paths.pavlovia").then(resp => resp),
      users: () => ipcRenderer.invoke("electron.paths.pavlovia.users").then(resp => resp),
      projects: () => ipcRenderer.invoke("electron.paths.pavlovia.projects").then(resp => resp),
    }
  },
  files: {
    load: (file) => ipcRenderer.invoke("electron.files.load", file).then(resp => resp),
    save: (file, content) => ipcRenderer.invoke("electron.files.save", file, content).then(resp => resp),
    exists: (file) => ipcRenderer.invoke("electron.files.exists", file).then(resp => resp),
    stat: (file) => ipcRenderer.invoke("electron.files.stat", file).then(resp => resp),
    mkdir: (path, recursive=true) => ipcRenderer.invoke("electron.files.mkdir", path, recursive).then(resp => resp),
    openDialog: (options) => ipcRenderer.invoke("electron.files.openDialog", options).then(resp => resp),
    saveDialog: (options) => ipcRenderer.invoke("electron.files.saveDialog", options).then(resp => resp),
    scandir: (root) => ipcRenderer.invoke("electron.files.scandir", root).then(resp => resp),
    showItemInFolder: (folder) => ipcRenderer.invoke("electron.files.showItemInFolder", folder),
    openPath: (path) => ipcRenderer.invoke("electron.files.openPath", path),
    openExternal: (url) => ipcRenderer.invoke("electron.files.openExternal", url)
  },
  clipboard: {
    get: () => ipcRenderer.invoke("electron.clipboard.get").then(resp => resp),
    set: (value) => ipcRenderer.invoke("electron.clipboard.set", value).then(resp => resp)
  },
  authenticatePavlovia: (url) => ipcRenderer.invoke("electron.authenticatePavlovia", url).then(resp => resp),
  version: () => ipcRenderer.invoke("electron.version").then(resp => resp),
  platform: () => ipcRenderer.invoke("electron.platform").then(resp => resp),
  quit: () => ipcRenderer.invoke("electron.quit")
};
// IMPORTANT: Electron-OH only honours the FIRST 3 contextBridge.exposeInMainWorld
// calls; any 4th/5th call (terminal, git) is silently dropped. So we nest terminal
// and git INSIDE the `python` object (the 2nd expose) instead of exposing them
// as separate globals. See FINAL_PROMPT Problem A.
contextBridge.exposeInMainWorld('electron', electron)

// Terminal API — defined before use, nested under python below
const terminal = {
  start: () => ipcRenderer.invoke("terminal.python.start").then(resp => resp),
  send: (id, msg) => ipcRenderer.invoke("terminal.python.send", id, msg).then(resp => resp),
  close: (id) => ipcRenderer.invoke("terminal.python.close", id).then(resp => resp),
  exec: (code) => ipcRenderer.invoke("terminal.python.exec", code).then(resp => resp),
  diagnose: () => ipcRenderer.invoke("terminal.python.diagnose").then(resp => resp),
};

// Git API — defined before use, nested under python below
const git = {
  listen: (lsnr) => ipcRenderer.on("git", lsnr),
  output: (message) => ipcRenderer.invoke("git.output", message),
  getRemote: (folder, user) => ipcRenderer.invoke("git.getRemote", folder, user),
  pull: (folder, user, force=true) => ipcRenderer.invoke("git.pull", folder, user, force),
  stage: (folder) => ipcRenderer.invoke("git.stage", folder),
  commit: (message, folder, user) => ipcRenderer.invoke("git.commit", message, folder, user),
  push: (folder, user, force=false) => ipcRenderer.invoke("git.push", folder, user, force),
  newProject: (details, folder, user) => ipcRenderer.invoke("git.newProject", details, folder, user).then(resp => resp)
};

// details about Python process (carries terminal + git nested to stay within the
// 3-expose limit of Electron-OH's contextBridge)
const python = {
  liaison: {
    start: (venv) => ipcRenderer.invoke("python.liaison.start",venv).then(resp => resp),
    stop: (venv) => ipcRenderer.invoke("python.liaison.stop",venv).then(resp => resp),
    listen: (tag, lsnr) => ipcRenderer.on(`liaison:${tag}`, lsnr),
    send: (venv, message, timeout) => ipcRenderer.invoke("python.liaison.send", venv, message, timeout).then(resp => resp),
    started: (venv) => ipcRenderer.invoke("python.liaison.started", venv).then(resp => resp),
    ready: (venv) => ipcRenderer.invoke("python.liaison.ready", venv).then(resp => resp)
  },
  venv: {
    setup: (venv, prerelease=false) => ipcRenderer.invoke("python.venv.setup", venv, prerelease).then(resp => resp),
    executable: (venv) => ipcRenderer.invoke("python.venv.executable", venv).then(resp => resp),
    installPackage: (venv, name) => ipcRenderer.invoke("python.venv.installPackage", venv, name).then(resp => resp),
    uninstallPackage: (venv, name) => ipcRenderer.invoke("python.venv.uninstallPackage", venv, name).then(resp => resp),
    getPackages: (venv) => ipcRenderer.invoke("python.venv.getPackages", venv).then(resp => resp),
    getPackageDetails: (venv, name) => ipcRenderer.invoke("python.venv.getPackageDetails", venv, name).then(resp => resp),
    installAllDeps: () => ipcRenderer.invoke("python.venv.installAllDeps").then(resp => resp)
  },
  uv: {
    folder: () => ipcRenderer.invoke("python.uv.folder").then(resp => resp),
    executable: () => ipcRenderer.invoke("python.uv.executable").then(resp => resp),
    exists: () => ipcRenderer.invoke("python.uv.exists").then(resp => resp),
    install: () => ipcRenderer.invoke("python.uv.install").then(resp => resp),
    makeExecutable: (psychopyVersion, pythonVersion) => ipcRenderer.invoke("python.uv.makeExecutable", psychopyVersion, pythonVersion).then(resp => resp),
    findPython: (version) => ipcRenderer.invoke("python.uv.findPython", version).then(resp => resp),
    getEnvironments: () => ipcRenderer.invoke("python.uv.getEnvironments").then(resp => resp),
    output: {
      send: (message) => ipcRenderer.send("uv", message),
      listen: (lsnr) => ipcRenderer.on("uv", lsnr)
    }
  },
  output: {
    stdout: {
      send: (message) => ipcRenderer.send("stdout", message),
      listen: (lsnr) => ipcRenderer.on("stdout", lsnr)
    },
    stderr: {
      send: (message) => ipcRenderer.send("stderr", message),
      listen: (lsnr) => ipcRenderer.on("stderr", lsnr)
    }
  },
  shell: {
    list: (venv) => ipcRenderer.invoke("python.shell.list", venv).then(resp => resp),
    send: (venv, id, msg) => ipcRenderer.invoke("python.shell.send", venv, id, msg).then(resp => resp),
    open: (venv) => ipcRenderer.invoke("python.shell.open", venv).then(resp => resp),
    close: (venv, id) => ipcRenderer.invoke("python.shell.close", venv, id).then(resp => resp)
  },
  scripts: {
    run: (venv, file, ...args) => ipcRenderer.invoke("python.scripts.run", venv, file, ...args).then(resp => resp),
    finished: (venv, id) => ipcRenderer.invoke("python.scripts.finished", venv, id).then(resp => resp),
    stop: (venv, id) => ipcRenderer.invoke("python.scripts.stop", venv, id).then(resp => resp),
  },
  psychojs: {
    run: (cwd) => ipcRenderer.invoke("python.psychojs.run", cwd).then(resp => resp),
    stop: (address) => ipcRenderer.invoke("python.psychojs.stop", address).then(resp => resp),
    browserRun: (jsCode, expName, conditionsJSON, resourcesJSON, expDir, psyexpPath) => ipcRenderer.invoke("python.psychojs.browserRun", jsCode, expName, conditionsJSON, resourcesJSON, expDir, psyexpPath).then(resp => resp),
    saveLog: (logData, savePath) => ipcRenderer.invoke("python.psychojs.saveLog", logData, savePath).then(resp => resp),
    browserStop: (address) => ipcRenderer.invoke("python.psychojs.browserStop", address).then(resp => resp),
    readConditions: (filePath) => ipcRenderer.invoke("python.psychojs.readConditions", filePath).then(resp => resp),
  },
  // nested bridges (Problem A: keep within the 3-expose limit)
  terminal: terminal,
  git: git,
  // Problem B: on-demand health check of main-process handler registration
  health: () => ipcRenderer.invoke("python.health").then(resp => resp),
  // 平板形态因子（独立判定，不依赖 bundle 内嵌 HNP）：无系统 Python = 平板模式运行时
  tablet: () => ipcRenderer.invoke("python.tablet").then(resp => resp)
}
contextBridge.exposeInMainWorld('python', python)

// details about HarmonyOS runtime
const harmony = {
  isHarmonyOS: () => ipcRenderer.invoke("python.harmony.isHarmonyOS").then(resp => resp),
  strategy: () => ipcRenderer.invoke("python.harmony.strategy").then(resp => resp),
  nativePython: () => ipcRenderer.invoke("python.harmony.nativePython").then(resp => resp),
  pythonVersion: () => ipcRenderer.invoke("python.harmony.pythonVersion").then(resp => resp),
  diagnose: () => ipcRenderer.invoke("python.harmony.diagnose").then(resp => resp),
  guidance: () => ipcRenderer.invoke("python.harmony.guidance").then(resp => resp),
  autoInstall: () => ipcRenderer.invoke("python.harmony.autoInstall").then(resp => resp),
  // 运行模式（平板模式 bundle / 电脑模式 dev），显式切换，不自动降级
  mode: () => ipcRenderer.invoke("python.mode").then(resp => resp),
  setMode: (mode) => ipcRenderer.invoke("python.mode.set", mode).then(resp => resp),
  status: () => ipcRenderer.invoke("python.status").then(resp => resp),
  systemAvailable: () => ipcRenderer.invoke("python.system.available").then(resp => resp),
  bundleAvailable: () => ipcRenderer.invoke("python.bundle.available").then(resp => resp)
};
contextBridge.exposeInMainWorld('harmony', harmony)

// Forward Python stdout/stderr + main-process logs to the renderer via DOM events
// (contextBridge can't serialize ipcRenderer.on listeners directly)
// Also: terminal button injection
window.addEventListener('DOMContentLoaded', () => {
  const _logBuffer = [];

  // Forward ipcRenderer events to the page as DOM custom events
  ipcRenderer.on("stdout", (evt, data) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    window.dispatchEvent(new CustomEvent('term-stdout', { detail: text }));
  });
  ipcRenderer.on("stderr", (evt, data) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    window.dispatchEvent(new CustomEvent('term-stderr', { detail: text }));
  });
  // Main-process [D] logs forwarded to the UI (Problem B)
  ipcRenderer.on("app-log", (evt, data) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    _logBuffer.push(text);
    window.dispatchEvent(new CustomEvent('term-log', { detail: text }));
  });
  ipcRenderer.on("python-status", (evt, data) => {
    window.dispatchEvent(new CustomEvent('term-status', { detail: JSON.stringify(data) }));
  });

  setTimeout(() => {
    if (document.getElementById('harmony-terminal-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'harmony-terminal-btn';
    btn.textContent = '>_';
    btn.title = 'Python Terminal';
    btn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;width:44px;height:44px;border-radius:22px;border:1px solid var(--overlay,#45475a);background:var(--mantle,#1e1e2e);color:var(--green,#a6e3a1);font-size:18px;font-weight:bold;cursor:pointer;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    btn.onclick = () => {
      const p = document.getElementById('harmony-terminal-panel');
      if (p) { p.style.display = p.style.display === 'none' ? 'block' : 'none'; return; }
      const panel = document.createElement('div');
      panel.id = 'harmony-terminal-panel';
      panel.style.cssText = 'position:fixed;bottom:68px;right:16px;width:480px;height:320px;z-index:9998;background:var(--base,#1e1e2e);border:1px solid var(--overlay,#45475a);border-radius:8px;display:flex;flex-direction:column;overflow:hidden;resize:both;';
      panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:var(--mantle,#181825);border-bottom:1px solid var(--overlay,#45475a)"><span style="color:var(--text,#cdd6f4);font-size:13px;font-weight:600">Python Terminal</span><div><button id="hterm-health" style="margin-right:4px;padding:2px 8px;font-size:11px;background:var(--surface0,#313244);color:var(--text,#cdd6f4);border:1px solid var(--overlay,#45475a);border-radius:4px;cursor:pointer">Health</button><button id="hterm-diag" style="margin-right:4px;padding:2px 8px;font-size:11px;background:var(--surface0,#313244);color:var(--text,#cdd6f4);border:1px solid var(--overlay,#45475a);border-radius:4px;cursor:pointer">Diagnose</button><button id="hterm-clear" style="padding:2px 8px;font-size:11px;background:var(--surface0,#313244);color:var(--text,#cdd6f4);border:1px solid var(--overlay,#45475a);border-radius:4px;cursor:pointer">Clear</button><button id="hterm-close" style="margin-left:4px;padding:2px 8px;font-size:11px;background:var(--red,#f38ba8);color:#fff;border:none;border-radius:4px;cursor:pointer">x</button></div></div><pre id="hterm-out" style="flex:1;margin:0;padding:8px 12px;color:var(--text,#cdd6f4);font-family:monospace;font-size:12px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;background:var(--base,#1e1e2e)"></pre>';
      document.body.appendChild(panel);
      const out = document.getElementById('hterm-out');
      const append = (line, color='var(--text,#cdd6f4)') => {
        if (!out) return;
        const span = document.createElement('div');
        span.style.color = color;
        span.style.whiteSpace = 'pre-wrap';
        span.textContent = line;
        out.appendChild(span);
        out.scrollTop = out.scrollHeight;
      };
      // ── 运行模式切换栏（平板模式 bundle / 电脑模式 dev，显式切换不自动降级）──
      const modeBar = document.createElement('div');
      modeBar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 12px;background:var(--mantle,#181825);border-bottom:1px solid var(--overlay,#45475a);font-size:12px;color:var(--text,#cdd6f4)';
      modeBar.innerHTML = '<span>模式:</span>' +
        '<button id="hterm-mode-bundle" style="padding:2px 10px;font-size:11px;border:1px solid var(--overlay,#45475a);border-radius:4px;cursor:pointer">平板模式</button>' +
        '<button id="hterm-mode-dev" style="padding:2px 10px;font-size:11px;border:1px solid var(--overlay,#45475a);border-radius:4px;cursor:pointer">电脑模式</button>' +
        '<span id="hterm-mode-status" style="color:var(--overlay,#6c7086);font-size:11px"></span>';
      panel.insertBefore(modeBar, out);
      const bundleBtn = document.getElementById('hterm-mode-bundle');
      const devBtn = document.getElementById('hterm-mode-dev');
      const statusSpan = document.getElementById('hterm-mode-status');
      const refreshMode = async () => {
        try {
          const st = await ipcRenderer.invoke("python.status");
          const cur = (st && st.mode) || 'bundle';
          const sysOk = !!(st && st.systemAvailable);
          const bundleOk = !!(st && st.bundleAvailable);
          const paint = (b, active) => {
            b.style.fontWeight = active ? 'bold' : 'normal';
            b.style.background = active ? 'var(--green,#a6e3a1)' : 'var(--surface0,#313244)';
            b.style.color = active ? '#11111b' : 'var(--text,#cdd6f4)';
          };
          // 环境变量 PSYCHOPY_MODE 锁定：此处切换不生效，置灰并告警
          if (st && st.envLocked) {
            const envMode = (st && st.envMode) || '';
            paint(bundleBtn, false);
            paint(devBtn, false);
            bundleBtn.disabled = true;
            devBtn.disabled = true;
            statusSpan.style.color = 'var(--red,#f38ba8)';
            statusSpan.textContent = '⚠ 已锁定：启动环境变量 PSYCHOPY_MODE=' + envMode + ' 优先，切换栏不生效（需移除该变量后重启 app）';
            return;
          }
          statusSpan.style.color = 'var(--overlay,#6c7086)';
          paint(bundleBtn, cur === 'bundle');
          paint(devBtn, cur === 'dev');
          // 关键修复：不再禁用按钮 —— 允许主动来回切换。
          // 目标模式当前 Python 不可用时，仅给视觉告警（半透明+橙字），不锁死，
          // 否则会出现「切到 dev 后因为 bundle 未注入而再也点不回平板模式」的死锁。
          bundleBtn.disabled = false;
          devBtn.disabled = false;
          const markUnready = (b) => {
            b.style.opacity = '0.55';
            b.style.color = 'var(--yellow,#f9e2af)';
            b.title = '该模式 Python 当前不可用（尚未注入/未就绪），切过去暂时跑不了命令，但仍可随时切回';
          };
          const markReady = (b, label) => { b.style.opacity = '1'; b.style.color = b === bundleBtn && cur === 'bundle' ? '#11111b' : (b === devBtn && cur === 'dev' ? '#11111b' : 'var(--text,#cdd6f4)'); b.title = label; };
          // 运行时形态（tablet/pc）与 Python 来源（bundle 内嵌 / dev 系统）解耦：
          // 平板模式下即便两种 Python 来源都不可用，也仍是无 Python 的平板模式，不报错。
          const tablet = !sysOk;
          if (cur === 'bundle') {
            markReady(bundleBtn, '当前：平板模式（运行时）');
            if (sysOk) markReady(devBtn, '切换为电脑模式（系统 Python）'); else markUnready(devBtn);
          } else {
            markReady(devBtn, '当前：电脑模式（系统 Python）');
            if (bundleOk) markReady(bundleBtn, '切换为平板模式（运行时）'); else markUnready(bundleBtn);
          }
          let hint;
          if (tablet) {
            // 平板形态：状态应显示「平板模式」，而非「找不到 Python」
            hint = '平板模式' + (bundleOk ? '（内嵌 Python 可用）' : '（无 Python，仅浏览器运行）');
          } else {
            hint = cur === 'dev' ? '电脑模式（系统 Python）' : '平板模式（内嵌 Python）';
          }
          statusSpan.textContent = hint;
        } catch (e) {
          statusSpan.textContent = '模式读取失败';
        }
      };
      const doSetMode = async (m) => {
        try {
          const r = await ipcRenderer.invoke("python.mode.set", m);
          append('[mode] set ' + m + ' -> ' + JSON.stringify(r), 'var(--mauve,#cba6f7)');
          await refreshMode();
          const targetOk = m === 'dev'
            ? (r && r.status && r.status.systemAvailable)
            : (r && r.status && r.status.bundleAvailable);
          if (!targetOk) {
            append('[mode] ⚠ ' + (m === 'dev' ? '电脑模式(系统 Python)' : '平板模式(内嵌 Python)') + ' 来源当前不可用：切过去暂时跑不了 Python 命令，但仍是无 Python 的平板模式（浏览器实验可用），注入/就绪后即可恢复。', 'var(--yellow,#f9e2af)');
          }
          append('[mode] 已保存，下次运行命令即生效（无需重启）。注意：若启动时设了 PSYCHOPY_MODE 环境变量，它会优先于此处设置。', 'var(--overlay,#6c7086)');
        } catch (e) {
          append('[mode] error: ' + (e && e.message ? e.message : String(e)), 'var(--red,#f38ba8)');
        }
      };
      bundleBtn.onclick = () => doSetMode('bundle');
      devBtn.onclick = () => doSetMode('dev');
      refreshMode();
      // ── 命令输入行：直接用 app 自己的 Python 进程跑代码 (terminal.python.exec) ──
      const inputRow = document.createElement('div');
      inputRow.style.cssText = 'display:flex;gap:6px;padding:6px;background:var(--mantle,#181825);border-top:1px solid var(--overlay,#45475a)';
      const input = document.createElement('input');
      input.id = 'hterm-input';
      input.placeholder = 'Python 命令，回车运行，如：import numpy; print(numpy.__version__)';
      input.style.cssText = 'flex:1;padding:5px 8px;font-family:monospace;font-size:12px;background:var(--base,#1e1e2e);color:var(--text,#cdd6f4);border:1px solid var(--overlay,#45475a);border-radius:4px;';
      const runBtn = document.createElement('button');
      runBtn.textContent = '运行';
      runBtn.style.cssText = 'padding:5px 14px;font-size:12px;background:var(--green,#a6e3a1);color:#11111b;border:none;border-radius:4px;cursor:pointer;';
      inputRow.appendChild(input);
      inputRow.appendChild(runBtn);
      panel.appendChild(inputRow);
      const runCode = async () => {
        const code = input.value.trim();
        if (!code) return;
        append('>>> ' + code, 'var(--blue,#89b4fa)');
        input.value = '';
        try {
          const res = await ipcRenderer.invoke("terminal.python.exec", code);
          append((res === undefined || res === null || res === '') ? '(无输出)' : String(res), 'var(--text,#cdd6f4)');
        } catch (e) {
          append('Error: ' + (e && e.message ? e.message : String(e)), 'var(--red,#f38ba8)');
        }
      };
      runBtn.onclick = runCode;
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') runCode(); });
      setTimeout(() => input.focus(), 0);
      const term = () => (window.python && window.python.terminal) ? window.python.terminal : (window.terminal || null);
      document.getElementById('hterm-close').onclick = () => panel.remove();
      document.getElementById('hterm-clear').onclick = () => { if (out) out.textContent = ''; };
      document.getElementById('hterm-diag').onclick = async () => {
        append('--- Running diagnostics ---', 'var(--mauve,#cba6f7)');
        // NOTE: this preload code runs in the ISOLATED world, so it cannot see
        // the main-world `window.python` injected by contextBridge. Call the IPC
        // channel directly via ipcRenderer (always available here).
        try {
          const diag = await ipcRenderer.invoke("python.harmony.diagnose");
          append(typeof diag === 'string' ? diag : JSON.stringify(diag, null, 2), 'var(--green,#a6e3a1)');
        } catch(e1) {
          // fallback to the terminal diagnose channel
          try {
            const r = await ipcRenderer.invoke("terminal.python.diagnose");
            append(typeof r === 'string' ? r : JSON.stringify(r, null, 2), 'var(--green,#a6e3a1)');
          } catch(e2) {
            append('Diagnose error: ' + (e2 && e2.message ? e2.message : String(e2)), 'var(--red,#f38ba8)');
          }
        }
        // Replay buffered main-process logs
        if (_logBuffer.length) {
          append('--- recent app logs ---', 'var(--overlay,#6c7086)');
          for (const l of _logBuffer.slice(-20)) append(l, 'var(--overlay,#6c7086)');
        }
      };
      document.getElementById('hterm-health').onclick = async () => {
        append('--- handler registration ---', 'var(--mauve,#cba6f7)');
        try {
          const s = await ipcRenderer.invoke("python.health");
          append(JSON.stringify(s, null, 2), 'var(--blue,#89b4fa)');
        } catch(e) {
          append('Health error: ' + (e && e.message ? e.message : String(e)), 'var(--red,#f38ba8)');
        }
      };
      // Listen to forwarded stdout/stderr/log events
      window.addEventListener('term-stdout', (e) => append(e.detail));
      window.addEventListener('term-stderr', (e) => append(e.detail, 'var(--red,#f38ba8)'));
      window.addEventListener('term-log', (e) => append(e.detail, 'var(--overlay,#6c7086)'));
    };
    document.body.appendChild(btn);
  }, 1000);
});
