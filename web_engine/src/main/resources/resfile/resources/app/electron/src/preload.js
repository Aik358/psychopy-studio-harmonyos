const { ipcRenderer, contextBridge } = require('electron');
let webUtils;
try { webUtils = require('electron').webUtils; } catch(_) { webUtils = undefined; }


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
contextBridge.exposeInMainWorld('electron', electron)

// details about Python process
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
    getPackageDetails: (venv, name) => ipcRenderer.invoke("python.venv.getPackageDetails", venv, name).then(resp => resp)
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
    browserRun: (jsCode, expName, conditionsJSON, resourcesJSON, expDir) => ipcRenderer.invoke("python.psychojs.browserRun", jsCode, expName, conditionsJSON, resourcesJSON, expDir).then(resp => resp),
    saveLog: (logData, savePath) => ipcRenderer.invoke("python.psychojs.saveLog", logData, savePath).then(resp => resp),
    browserStop: (address) => ipcRenderer.invoke("python.psychojs.browserStop", address).then(resp => resp),
    readConditions: (filePath) => ipcRenderer.invoke("python.psychojs.readConditions", filePath).then(resp => resp),
  }
}
contextBridge.exposeInMainWorld('python', python)

const git = {
  listen: (lsnr) => ipcRenderer.on("git", lsnr),
  output: (message) => ipcRenderer.invoke("git.output", message),
  getRemote: (folder, user) => ipcRenderer.invoke("git.getRemote", folder, user),
  pull: (folder, user, force=true) => ipcRenderer.invoke("git.pull", folder, user, force),
  stage: (folder) => ipcRenderer.invoke("git.stage", folder),
  commit: (message, folder, user) => ipcRenderer.invoke("git.commit", message, folder, user),
  push: (folder, user, force=false) => ipcRenderer.invoke("git.push", folder, user, force),
  newProject: (details, folder, user) => ipcRenderer.invoke("git.newProject", details, folder, user).then(resp => resp)
}

contextBridge.exposeInMainWorld('git', git)

// ── Terminal API ──────────────────────────────────────────────
const terminal = {
  start: () => ipcRenderer.invoke("terminal.python.start").then(resp => resp),
  send: (id, msg) => ipcRenderer.invoke("terminal.python.send", id, msg).then(resp => resp),
  close: (id) => ipcRenderer.invoke("terminal.python.close", id).then(resp => resp),
  exec: (code) => ipcRenderer.invoke("terminal.python.exec", code).then(resp => resp),
  diagnose: () => ipcRenderer.invoke("terminal.python.diagnose").then(resp => resp),
  onStdout: (lsnr) => ipcRenderer.on("stdout", lsnr),
  onStderr: (lsnr) => ipcRenderer.on("stderr", lsnr),
}
contextBridge.exposeInMainWorld('terminal', terminal)

// ── Terminal UI Injector ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectTerminalUI, 2000);
  setTimeout(injectTerminalUI, 5000);
});

function injectTerminalUI() {
  if (document.getElementById('harmony-terminal-btn')) return;
  const nav = document.querySelector('nav') || document.querySelector('[class*="nav"]') || document.querySelector('header');
  if (!nav) return;
  const btn = document.createElement('button');
  btn.id = 'harmony-terminal-btn';
  btn.innerHTML = '\u{1F5A5} Terminal';
  btn.style.cssText = 'padding:4px 12px;margin:0 4px;border:1px solid var(--color-border,#444);border-radius:6px;background:var(--color-bg-secondary,#1a1a2e);color:var(--color-text,#e0e0e0);cursor:pointer;font-size:13px;font-family:inherit;transition:all 0.2s;';
  btn.onmouseover = () => btn.style.background = '#2a2a4e';
  btn.onmouseout = () => btn.style.background = 'var(--color-bg-secondary,#1a1a2e)';
  btn.onclick = toggleTerminal;
  nav.appendChild(btn);
  const panel = document.createElement('div');
  panel.id = 'harmony-terminal-panel';
  panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:300px;background:#0d1117;border-top:2px solid #30363d;z-index:99999;display:none;flex-direction:column;font-family:\'JetBrains Mono\',\'Cascadia Code\',\'Consolas\',monospace;';
  panel.innerHTML = '<div style="display:flex;align-items:center;padding:4px 12px;background:#161b22;border-bottom:1px solid #30363d;"><span style="color:#58a6ff;font-weight:600;font-size:13px;">Python Terminal</span><span id="term-status" style="margin-left:12px;color:#8b949e;font-size:12px;">Connecting...</span><div style="flex:1"></div><button id="term-diagnose" style="padding:2px 8px;font-size:11px;border:1px solid #30363d;border-radius:4px;background:#21262d;color:#c9d1d9;cursor:pointer;margin-right:4px;">Diagnose</button><button id="term-clear" style="padding:2px 8px;font-size:11px;border:1px solid #30363d;border-radius:4px;background:#21262d;color:#c9d1d9;cursor:pointer;margin-right:4px;">Clear</button><button id="term-close" style="padding:2px 8px;font-size:11px;border:1px solid #30363d;border-radius:4px;background:#21262d;color:#c9d1d9;cursor:pointer;">\u2715</button></div><div id="term-output" style="flex:1;overflow-y:auto;padding:8px 12px;font-size:13px;color:#c9d1d9;white-space:pre-wrap;line-height:1.4;">Python Terminal for HarmonyOS\nClick "Diagnose" to check Python environment.\n\n</div><div style="display:flex;padding:4px 8px;background:#161b22;border-top:1px solid #30363d;"><span style="color:#3fb950;margin-right:4px;">>>></span><input id="term-input" type="text" placeholder="Type Python code and press Enter..." style="flex:1;background:transparent;border:none;color:#c9d1d9;font-family:inherit;font-size:13px;outline:none;"/></div>';
  document.body.appendChild(panel);
  document.getElementById('term-close').onclick = toggleTerminal;
  document.getElementById('term-clear').onclick = () => { document.getElementById('term-output').innerHTML = ''; };
  document.getElementById('term-diagnose').onclick = runDiagnose;
  const input = document.getElementById('term-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const code = input.value;
      if (!code.trim()) return;
      appendOutput('>>> ' + code + '\n', '#58a6ff');
      input.value = '';
      execPython(code);
    }
  });
}
let termId = null;
async function ensureTerminal() {
  const status = document.getElementById('term-status');
  if (!termId) {
    try {
      termId = await window.terminal.start();
      status.textContent = 'Connected (ID: ' + termId + ')';
      status.style.color = '#3fb950';
      appendOutput('Terminal started. Python is ready.\n', '#3fb950');
    } catch (err) {
      status.textContent = 'Error: ' + (err.message || err);
      status.style.color = '#f85149';
    }
  }
}
async function execPython(code) {
  try {
    const result = await window.terminal.exec(code);
    if (result) appendOutput(result + '\n', '#c9d1d9');
  } catch (err) {
    appendOutput('Error: ' + (err.message || err) + '\n', '#f85149');
  }
}
async function runDiagnose() {
  appendOutput('\n--- Running diagnostics ---\n', '#d2a8ff');
  try {
    const result = await window.terminal.diagnose();
    appendOutput(result + '\n\n', '#8b949e');
  } catch (err) {
    appendOutput('Diagnostic error: ' + (err.message || err) + '\n', '#f85149');
  }
}
function appendOutput(text, color) {
  const out = document.getElementById('term-output');
  if (!out) return;
  const span = document.createElement('span');
  span.style.color = color || '#c9d1d9';
  span.textContent = text;
  out.appendChild(span);
  out.scrollTop = out.scrollHeight;
}
function toggleTerminal() {
  const panel = document.getElementById('harmony-terminal-panel');
  if (!panel) return;
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'flex';
    ensureTerminal();
  } else {
    panel.style.display = 'none';
  }
}
ipcRenderer.on('stdout', (evt, data) => { appendOutput(data, '#c9d1d9'); });
ipcRenderer.on('stderr', (evt, data) => { appendOutput(data, '#f85149'); });

// Fallback: if contextBridge.exposeInMainWorld didn't work (e.g. contextIsolation disabled),
// attach directly to window so frontend code doesn't get undefined
try {
  if (typeof window !== 'undefined') {
    if (!window.electron) window.electron = electron;
    if (!window.python) window.python = python;
    if (!window.git) window.git = git;
    if (!window.terminal) window.terminal = terminal;
  }
} catch(_) {}