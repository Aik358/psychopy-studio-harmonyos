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
try { contextBridge.exposeInMainWorld('electron', electron); } catch(_) {}

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
try { contextBridge.exposeInMainWorld('python', python); } catch(_) {}

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

try { contextBridge.exposeInMainWorld('git', git); } catch(_) {}

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
try { contextBridge.exposeInMainWorld('terminal', terminal); } catch(_) {}

// ── Terminal UI (integrated with page theme) ───────────────────
// Injects a terminal toggle button into the ribbon's Views section
// and a slide-up panel that uses the page's CSS variables.
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectTerminalButton, 500);
  setTimeout(injectTerminalButton, 1500);
  setTimeout(injectTerminalButton, 3000);
  // Use MutationObserver to detect when ribbon buttons appear
  const observer = new MutationObserver(() => {
    if (!document.getElementById('harmony-terminal-btn') && document.querySelector('button')) {
      injectTerminalButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // Stop observing after 10s to avoid memory leak
  setTimeout(() => observer.disconnect(), 10000);
});

function injectTerminalButton() {
  if (document.getElementById('harmony-terminal-btn')) return;
  // Find the Views ribbon section (last section with btn-builder/btn-coder buttons)
  const allButtons = document.querySelectorAll('button');
  let viewsSection = null;
  let insertAfterBtn = null;
  for (const btn of allButtons) {
    const img = btn.querySelector('img');
    if (img && (img.src.includes('btn-runner') || img.src.includes('btn-coder'))) {
      insertAfterBtn = btn;
      viewsSection = btn.parentElement;
    }
  }
  // Fallback: append to any nav/header
  if (!viewsSection) {
    viewsSection = document.querySelector('nav') || document.querySelector('header') || document.body;
  }
  if (!insertAfterBtn && viewsSection) {
    insertAfterBtn = viewsSection.lastElementChild;
  }
  
  // Create terminal toggle button matching IconButton style
  const btn = document.createElement('button');
  btn.id = 'harmony-terminal-btn';
  btn.className = 'harmony-term-toggle';
  btn.innerHTML = '<svg width="2.25rem" height="2.25rem" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="24" height="20" rx="2" stroke="var(--text)" stroke-width="1.5" fill="var(--base)"/><path d="M8 12L12 15L8 18" stroke="var(--green, #a6e3a1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="14" y1="18" x2="20" y2="18" stroke="var(--green, #a6e3a1)" stroke-width="1.5" stroke-linecap="round"/></svg>';
  btn.title = 'Python Terminal';
  btn.style.cssText = 'padding:0.25rem;margin:0;border:1px solid transparent;border-radius:0.5rem;background:transparent;cursor:pointer;display:grid;place-items:center;transition:border-color 0.2s, box-shadow 0.2s;';
  btn.onmouseenter = () => { btn.style.borderColor = 'var(--overlay, #45475a)'; btn.style.boxShadow = 'inset 1px 1px 10px rgba(0,0,0,0.05)'; };
  btn.onmouseleave = () => { btn.style.borderColor = 'transparent'; btn.style.boxShadow = 'none'; };
  btn.onclick = (e) => { e.preventDefault(); toggleTerminalPanel(); };
  
  if (insertAfterBtn && insertAfterBtn.nextSibling) {
    viewsSection.insertBefore(btn, insertAfterBtn.nextSibling);
  } else if (viewsSection) {
    viewsSection.appendChild(btn);
  }
  
  // Create the terminal panel (hidden by default)
  if (!document.getElementById('harmony-terminal-panel')) {
    createTerminalPanel();
  }
}

function createTerminalPanel() {
  const panel = document.createElement('div');
  panel.id = 'harmony-terminal-panel';
  panel.style.cssText = [
    'position:fixed',
    'bottom:0',
    'left:0',
    'right:0',
    'height:280px',
    'background:var(--mantle, #181825)',
    'border-top:1px solid var(--overlay, #45475a)',
    'z-index:99999',
    'display:none',
    'flex-direction:column',
    "font-family:'JetBrains Mono','Cascadia Code','Consolas',monospace",
    'transition:height 0.2s ease'
  ].join(';');
  
  panel.innerHTML = [
    '<div style="display:flex;align-items:center;padding:4px 12px;background:var(--crust, #11111b);border-bottom:1px solid var(--overlay, #45475a);">',
    '<svg width="1rem" height="1rem" viewBox="0 0 16 16" fill="none" style="margin-right:6px;"><path d="M3 4L6 7L3 10" stroke="var(--green, #a6e3a1)" stroke-width="1" stroke-linecap="round" fill="none"/></svg>',
    '<span style="color:var(--blue, #89b4fa);font-weight:600;font-size:12px;">Python Terminal</span>',
    '<span id="term-status" style="margin-left:8px;color:var(--subtext0, #a6adc8);font-size:11px;">Click to connect</span>',
    '<div style="flex:1"></div>',
    '<button id="term-diagnose" class="term-action-btn">Diagnose</button>',
    '<button id="term-clear" class="term-action-btn">Clear</button>',
    '<button id="term-close" class="term-action-btn">\u2715</button>',
    '</div>',
    '<div id="term-output" style="flex:1;overflow-y:auto;padding:8px 12px;font-size:12px;color:var(--text, #cdd6f4);white-space:pre-wrap;line-height:1.5;background:var(--base, #1e1e2e);">Python Terminal for HarmonyOS\nClick \"Diagnose\" to check Python environment.\n\n</div>',
    '<div style="display:flex;padding:4px 8px;background:var(--crust, #11111b);border-top:1px solid var(--overlay, #45475a);">',
    '<span style="color:var(--green, #a6e3a1);margin-right:4px;font-size:12px;">\u203a</span>',
    '<input id="term-input" type="text" placeholder="Type Python code and press Enter..." style="flex:1;background:transparent;border:none;color:var(--text, #cdd6f4);font-family:inherit;font-size:12px;outline:none;"/>',
    '</div>'
  ].join('');
  
  // Add style for action buttons
  const style = document.createElement('style');
  style.textContent = '.term-action-btn{padding:2px 8px;font-size:11px;border:1px solid var(--overlay, #45475a);border-radius:4px;background:var(--surface0, #313244);color:var(--text, #cdd6f4);cursor:pointer;margin-right:4px;transition:background 0.15s;}.term-action-btn:hover{background:var(--surface1, #45475a);}';
  document.head.appendChild(style);
  
  document.body.appendChild(panel);
  document.getElementById('term-close').onclick = toggleTerminalPanel;
  document.getElementById('term-clear').onclick = () => { document.getElementById('term-output').innerHTML = ''; };
  document.getElementById('term-diagnose').onclick = runDiagnose;
  const input = document.getElementById('term-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const code = input.value;
      if (!code.trim()) return;
      appendTermOutput('\u203a ' + code + '\n', 'var(--blue, #89b4fa)');
      input.value = '';
      execPython(code);
    }
  });
}

let termId = null;
let termConnected = false;
async function ensureTerminal() {
  const status = document.getElementById('term-status');
  if (!termId) {
    try {
      termId = await window.terminal.start();
      termConnected = true;
      status.textContent = 'Connected';
      status.style.color = 'var(--green, #a6e3a1)';
      appendTermOutput('Terminal started. Python is ready.\n', 'var(--green, #a6e3a1)');
      // Auto-run diagnose on first connect
      runDiagnose();
    } catch (err) {
      status.textContent = 'Error: ' + (err.message || err).substring(0, 60);
      status.style.color = 'var(--red, #f38ba8)';
      appendTermOutput('Failed to start terminal: ' + (err.message || err) + '\n', 'var(--red, #f38ba8)');
    }
  }
}
async function execPython(code) {
  try {
    const result = await window.terminal.exec(code);
    if (result) appendTermOutput(result + '\n', 'var(--text, #cdd6f4)');
  } catch (err) {
    appendTermOutput('Error: ' + (err.message || err) + '\n', 'var(--red, #f38ba8)');
  }
}
async function runDiagnose() {
  appendTermOutput('\n--- Running diagnostics ---\n', 'var(--mauve, #cba6f7)');
  try {
    const result = await window.terminal.diagnose();
    appendTermOutput(result + '\n\n', 'var(--subtext0, #a6adc8)');
  } catch (err) {
    appendTermOutput('Diagnostic error: ' + (err.message || err) + '\n', 'var(--red, #f38ba8)');
  }
}
function appendTermOutput(text, color) {
  const out = document.getElementById('term-output');
  if (!out) return;
  const span = document.createElement('span');
  span.style.color = color || 'var(--text, #cdd6f4)';
  span.textContent = text;
  out.appendChild(span);
  out.scrollTop = out.scrollHeight;
}
function toggleTerminalPanel() {
  const panel = document.getElementById('harmony-terminal-panel');
  if (!panel) return;
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'flex';
    ensureTerminal();
  } else {
    panel.style.display = 'none';
  }
}
ipcRenderer.on('stdout', (evt, data) => { appendTermOutput(data, 'var(--text, #cdd6f4)'); });
ipcRenderer.on('stderr', (evt, data) => { appendTermOutput(data, 'var(--red, #f38ba8)'); });

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