const path = require('node:path');
const fs = require("fs");
const proc = require("child_process");
const { app, dialog, BrowserWindow, ipcMain, shell, systemPreferences } = require('electron');

// ── Problem B: surface main-process registration status + logs to the UI ──
// Electron-OH logs go to hilog (not visible on PC), so we (a) expose a
// python.health() IPC that reports what was registered, and (b) forward every
// console.log/error line to the renderer via the "app-log" channel.
const _registration = {
  electron: true,
  pythonBackend: false,
  harmony: false,
  terminal: false,
  git: false,
  errors: []
};
ipcMain.handle("python.health", () => ({ ..._registration, time: Date.now() }));

// ── Unified diagnostic (Problem B: merge the two Terminal buttons) ──────────
// Both the top-bar Terminal button (terminal.python.diagnose) and the floating
// >_ panel's Diagnose button (python.harmony.diagnose) delegate to this single
// builder, so they always "hear the same content": handler-registration health
// + the full Python environment diagnosis. It lazily imports harmony.js on click
// (never at module-load), so even if that import chain breaks again this handler
// stays registered — no more "No handler registered for terminal.python.diagnose".
async function _buildUnifiedDiagnose() {
  const lines = [];
  lines.push("=== handler registration ===");
  lines.push(JSON.stringify({ ..._registration, time: Date.now() }, null, 2));
  lines.push("");
  lines.push("=== python environment ===");
  try {
    const Harmony = await import("./harmony.js");
    const diag = Harmony.diagnosePythonEnvironment();
    lines.push(`HarmonyOS: ${diag.isHarmonyOS}`);
    lines.push(`Python path: ${diag.python || "(not found)"}`);
    lines.push(`Python version: ${diag.pythonVersion || "(unknown)"}`);
    lines.push(`Python OK (>=3.9): ${diag.pythonOk}`);
    lines.push(`pip available: ${diag.pipAvailable}`);
    lines.push(`venv available: ${diag.venvAvailable}`);
    lines.push(`recommendation: ${diag.recommendation}`);
    lines.push(`canProceed: ${diag.canProceed}`);
    if (diag.missingRequired && diag.missingRequired.length) {
      lines.push(`missing required: ${diag.missingRequired.map(m => m.import).join(", ")}`);
    }
    if (diag.pythonExecError) lines.push(`exec error: ${diag.pythonExecError}`);
    if (diag.harmonybrew) lines.push(`harmonybrew: ${diag.harmonybrew}`);
  } catch (err) {
    lines.push("(python environment diagnose unavailable: " +
      (err && err.message ? err.message : String(err)) + ")");
  }
  return lines.join("\n");
}
// Registered unconditionally here (NOT inside the fragile harmony import block),
// so the top-bar Terminal button always has a handler.
ipcMain.handle("terminal.python.diagnose", () => _buildUnifiedDiagnose());

function _broadcastLog(text) {
  for (const win of BrowserWindow.getAllWindows()) {
    try { win.webContents.send("app-log", text); } catch (_) {}
  }
}
const _origLog = console.log.bind(console);
const _origErr = console.error.bind(console);
console.log = (...args) => {
  _origLog(...args);
  try { _broadcastLog(args.map(a => (a && a.stack) ? a.stack : (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); } catch (_) {}
};
console.error = (...args) => {
  _origErr(...args);
  try { _broadcastLog(args.map(a => (a && a.stack) ? a.stack : (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); } catch (_) {}
};

// HarmonyOS platform detection (mirrors harmony.js env checks; no async import)
function isHarmonyPlatform() {
  return process.platform === "harmony" || process.platform === "ohos" ||
    !!(process.env && (process.env.OHOS || process.env.HARMONYOS || process.env.ELECTRON_OH));
}

// Open a URL for the user. On HarmonyOS we open with the SYSTEM browser
// (shell.openExternal) using the device's real network IP — the PsychoJS
// runner is served from an HTTP server bound to 0.0.0.0, so the device IP
// reaches it from the external browser. (127.0.0.1 from a separate system
// browser process is unreliable here, and the in-app window did not display
// on this platform, so the system browser is now the primary path.) The
// in-app window is kept only as a last-resort fallback.
let _externalWin = null;

function getDeviceIP() {
  try {
    var os = require('os');
    var ifaces = os.networkInterfaces();
    for (var name in ifaces) {
      var list = ifaces[name];
      if (!list) continue;
      for (var i = 0; i < list.length; i++) {
        var addr = list[i];
        if (addr.family === 'IPv4' && !addr.internal) return addr.address;
      }
    }
  } catch (e) {}
  return "127.0.0.1";
}

function externalUrl(url) {
  try {
    return String(url).replace(/127\.0\.0\.1|localhost/gi, getDeviceIP());
  } catch (e) { return url; }
}

function openBrowserUrl(url) {
  const target = String(url);
  if (isHarmonyPlatform()) {
    // Primary: system browser on the device network IP (server binds 0.0.0.0).
    try {
      shell.openExternal(externalUrl(target));
      return true;
    } catch (e) {
      console.error("[openBrowserUrl] system browser failed, falling back to in-app window:", e?.message);
    }
    // Fallback: in-app window (same-process loopback reachable).
    try {
      if (!_externalWin || _externalWin.isDestroyed()) {
        _externalWin = new BrowserWindow({
          width: 1200, height: 850, show: false,
          webPreferences: { contextIsolation: true, nodeIntegration: false, webSecurity: true }
        });
        _externalWin.once("ready-to-show", () => {
          try { _externalWin.show(); _externalWin.focus(); } catch (e) {}
        });
        _externalWin.on("closed", () => { if (_externalWin && _externalWin.isDestroyed()) _externalWin = null; });
        _externalWin.webContents.on("did-fail-load", (ev, code, desc, failedUrl) => {
          console.error("[openBrowserUrl] did-fail-load:", code, desc, failedUrl);
        });
      }
      _externalWin.loadURL(target);
      return true;
    } catch (e) {
      console.error("[openBrowserUrl] in-app window failed:", e?.message);
    }
    return false;
  }
  // Non-HarmonyOS: just use the system browser.
  try {
    shell.openExternal(target);
    return true;
  } catch (e) {
    console.error("[openBrowserUrl] shell.openExternal failed:", e);
    return false;
  }
}

// Request one-time OS access to Desktop / Documents / Downloads so bare fs can
// read/write them without a file picker. HarmonyOS only shows the system popup
// ONCE; if it was already consumed/denied, this returns false and the caller
// should guide the user to Settings (see openApplicationInfoEntry).
// Real API on Electron-HarmonyOS (per official docs / ohos_electron_hap):
//   systemPreferences.requestDirectoryPermission("")  // "" => all three dirs
async function requestDirectoryPermission() {
  try {
    console.log("[permissions] requesting Desktop/Documents/Downloads access...");
    const ok = await systemPreferences.requestDirectoryPermission("");
    console.log("[permissions] requestDirectoryPermission('') =>", ok);
    return ok;
  } catch (e) {
    console.warn("[permissions] requestDirectoryPermission failed:", e?.message);
    return false;
  }
}

// Jump to the app's Settings > Permissions page. Needed when the one-time
// popup was already dismissed/denied and the user must re-grant manually.
async function openApplicationInfoEntry() {
  try {
    if (typeof systemPreferences?.openApplicationInfoEntry === "function") {
      await systemPreferences.openApplicationInfoEntry();
      return true;
    }
  } catch (e) {
    console.warn("[permissions] openApplicationInfoEntry failed:", e?.message);
  }
  return false;
}

// make sure psychopy4 folder exists before importing subpackages
if (!fs.existsSync(path.join(app.getPath("appData"), "psychopy4"))) {
  fs.mkdirSync(
    path.join(app.getPath("appData"), "psychopy4")
  )
}

// Load all ES Modules via dynamic import (cannot require ESM from CJS)
(async () => {
  const [loggingModule, usageModule, versionModule, gitModule] = await Promise.all([
    import("./logging.js"),
    import("./usage.js"),
    import("./version.js"),
    import("./git.js")
  ]);

  const logging = loggingModule.default;
  const { UsageReport } = usageModule;
  const { appVersion, isDev } = versionModule;

  // ★ Enable real Python backend (non-blocking, won't prevent window creation)
  let pythonHandlers = {};
  try {
    // Use the official python/index.js (same as desktop PsychoPy Studio)
    // This registers liaison, uv, venv, shell, scripts, psychojs handlers
    const pythonModule = await import("./python/index.js");
    pythonHandlers = pythonModule.handlers;
    _registration.pythonBackend = true;
    console.log('[D] Python backend loaded OK');
  } catch (err) {
    _registration.errors.push('python.backend: ' + (err && err.message ? err.message : String(err)));
    console.error('[D] Python backend FAILED to load:', err);
  }
  // ★ HarmonyOS tablet detection + terminal — registered here, NOT via harmony-python.js
  //    harmony-python.js overrides/replaces handlers that python/index.js already set up,
  //    and its import chain is fragile. By registering these directly, the official
  //    Python liaison (via python/liaison.js) remains intact.
  try {
    const Harmony = await import("./harmony.js");
    ipcMain.handle("python.harmony.isHarmonyOS", () => Harmony.isHarmonyOS());
    // Same unified content as the top-bar Terminal button (see _buildUnifiedDiagnose).
    ipcMain.handle("python.harmony.diagnose", () => _buildUnifiedDiagnose());
    ipcMain.handle("python.harmony.strategy", () => Harmony.getPythonStrategy());
    ipcMain.handle("python.harmony.nativePython", () => Harmony.findNativePython());
    ipcMain.handle("python.harmony.pythonVersion", () => {
      const p = Harmony.findNativePython();
      return p ? Harmony.getPythonVersion(p) : null;
    });
    ipcMain.handle("python.harmony.guidance", () => {
      const d = Harmony.diagnosePythonEnvironment();
      return Harmony.generateSetupGuidance(d);
    });

    // NOTE: terminal.python.start/send/close/exec are owned by harmony-python.js
    // (registered in registerHarmonyPythonHandlers, using the bundle-aware
    //  getPython() + getPythonEnv()). Registering them here too would cause a
    //  duplicate-handler throw and abort that module's later registrations.
    // terminal.python.diagnose is registered unconditionally at module top
    // (see _buildUnifiedDiagnose) so it survives even if this harmony block fails.
    _registration.harmony = true;
    _registration.terminal = true;
    console.log('[D] HarmonyOS handlers registered OK (direct, no harmony-python.js)');
  } catch (err) {
    _registration.errors.push('harmony.terminal: ' + (err && err.message ? err.message : String(err)));
    console.error('[D] HarmonyOS handlers FAILED:', err);
  }
  // ★ 注册 harmony-python.js 的 handler（python.status / python.mode.set /
  //   terminal.python.exec / python.uv.* / python.venv.* / python.liaison.* 等）。
  //   这些此前因 registerHarmonyPythonHandlers() 从未被调用而全部未注册，
  //   导致前端报 "No handler registered"。harmony-python.js 内部已对可能重名的
  //   channel 做 removeHandler 兜底；python.harmony.* 与 python.psychojs.*
  //   的重名项已在 harmony-python.js 中删除，由本文件直接注册，避免重复注册抛异常。
  try {
    const harmonyPy = await import("./harmony-python.js");
    if (typeof harmonyPy.registerHarmonyPythonHandlers === "function") {
      harmonyPy.registerHarmonyPythonHandlers();
      _registration.terminal = true;
      console.log('[D] harmony-python.js handlers registered OK');
    } else {
      throw new Error("registerHarmonyPythonHandlers not exported from harmony-python.js");
    }
  } catch (err) {
    _registration.errors.push('harmony-python: ' + (err && err.message ? err.message : String(err)));
    console.error('[D] harmony-python.js handlers FAILED:', err);
  }
  // psychoJS browser runner IPC (惰性加载，不阻塞主进程启动)
  // 在当前窗口 loadFile() 加载实验（最稳方案）
  // ★ 浏览器实验运行：起本地 HTTP server → shell.openExternal → 系统浏览器打开
  // Read and parse XLSX conditions file, return JSON
  // ★ 回退顺序修正（修复"授权后仍弹窗手选"回归）：
  //   直读(XLSX.readFile) → buffer 兜底(fs.readFileSync+XLSX.read) → 最后才弹窗手选。
  //   原顺序把阻塞弹窗排在第二，导致授权后本可裸读的文件仍被弹窗打断。
  ipcMain.handle("python.psychojs.readConditions", async (evt, filePath) => {
    try {
      var XLSX = require("xlsx");
      var fs = require("fs");
      function readPath(fp) { var wb = XLSX.readFile(fp); return JSON.stringify(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])); }
      function readBuf(fp) { var buf = fs.readFileSync(fp); var wb = XLSX.read(buf, {type: "buffer"}); return JSON.stringify(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])); }

      // 1) 直读（路径方式）
      try { return readPath(filePath); }
      catch (e1) { console.warn("[readConditions] readFile failed:", filePath, "->", e1?.message); }

      // 2) buffer 兜底（同一文件，绕过某些路径/编码问题）
      try { return readBuf(filePath); }
      catch (e2) { console.warn("[readConditions] buffer read failed:", filePath, "->", e2?.message); }

      // 3) 最后才弹窗让用户手选（真正的 last resort）
      try {
        var result = dialog.showOpenDialogSync({
          title: "Select conditions file",
          defaultPath: filePath,
          filters: [{ name: "Conditions", extensions: ["xlsx","csv","xls"] }]
        });
        if (result && result.length > 0) {
          try { return readPath(result[0]); } catch(_) { return readBuf(result[0]); }
        }
        return "[]";
      } catch (e3) {
        console.error("[readConditions] dialog failed:", e3?.message);
        return "[]";
      }
    } catch (err) {
      console.error("[psychojs-browser] readConditions failed:", err?.message || err);
      return "[]";
    }
  });

  // ★ Python-backed PsychoJS code generation
  // Spawns Python to call psychopy.experiment.writeScript(target='PsychoJS')
  // Falls back gracefully if Python is not available
  ipcMain.handle("python.psychojs.generateJS", async (evt, psyexpPath, outputDir) => {
    const workerScript = path.join(__dirname, "python", "psychopy_worker.py");
    
    // Try to find a Python executable
    let pythonExe = null;
    const candidates = [
      path.join(__dirname, "..", "..", "python", "python.exe"),  // bundled
      "D:\\PsychoPy\\python.exe",  // Windows dev
      "/data/service/hnp/python.org/python_3.12/bin/python3",  // HarmonyOS HNP
      "/storage/Users/currentUser/.local/bin/python3",  // HarmonyOS user
      "/usr/bin/python3",  // Linux
      "/system/bin/python3",
    ];
    for (const c of candidates) {
      try {
        if (fs.existsSync(c)) {
          pythonExe = c;
          break;
        }
      } catch(_) {}
    }
    // Also try `which python3`
    if (!pythonExe) {
      try {
        pythonExe = proc.execSync("which python3", { timeout: 3000, encoding: 'utf8' }).trim();
      } catch(_) {}
    }
    
    if (!pythonExe || !fs.existsSync(pythonExe)) {
      return { error: "No Python found", status: "no_python" };
    }
    
    console.log("[generateJS] Using Python:", pythonExe);
    console.log("[generateJS] Worker:", workerScript);
    console.log("[generateJS] psyexp:", psyexpPath);
    
    // Use provided output dir or create a temp one
    const outDir = outputDir || path.join(app.getPath("temp"), "psychopy-oh-gen-" + Date.now());
    
    return new Promise((resolve) => {
      const args = [workerScript, "generate", psyexpPath, outDir];
      const child = proc.spawn(pythonExe, args, {
        cwd: path.dirname(workerScript),
        env: { ...process.env, PSYCHOPY_NO_GUI: '1', MPLBACKEND: 'Agg' },
        timeout: 30000,
      });
      
      let stdout = "";
      let stderr = "";
      child.stdout.on('data', (d) => stdout += d.toString());
      child.stderr.on('data', (d) => stderr += d.toString());
      child.on('close', (code) => {
        console.log(`[generateJS] Python exited code=${code}`);
        if (stderr) console.log(`[generateJS] stderr: ${stderr.slice(0, 500)}`);
        try {
          const result = JSON.parse(stdout.trim().split('\n').pop());
          if (result.status === 'ok') {
            console.log(`[generateJS] Generated: ${result.experiment_name}, files:`, Object.keys(result.files));
            resolve(result);
          } else {
            console.error('[generateJS] Error:', result.error);
            resolve({ error: result.error || 'Unknown error', status: 'gen_failed', stderr });
          }
        } catch(e) {
          console.error('[generateJS] Parse failed:', e.message, 'stdout:', stdout.slice(0, 200));
          resolve({ error: 'Failed to parse Python output: ' + e.message, status: 'parse_failed', stdout, stderr });
        }
      });
      child.on('error', (e) => {
        console.error('[generateJS] Spawn error:', e.message);
        resolve({ error: e.message, status: 'spawn_failed' });
      });
    });
  });
  
  // ★ Read conditions via Python (more robust than xlsx npm package)
  ipcMain.handle("python.psychojs.readConditionsPython", async (evt, filePath) => {
    const workerScript = path.join(__dirname, "python", "psychopy_worker.py");
    let pythonExe = null;
    const candidates = [
      path.join(__dirname, "..", "..", "python", "python.exe"),
      "D:\\PsychoPy\\python.exe",
      "/data/service/hnp/python.org/python_3.12/bin/python3",  // HarmonyOS HNP
      "/storage/Users/currentUser/.local/bin/python3",  // HarmonyOS user
      "/usr/bin/python3",
      "/system/bin/python3",
    ];
    for (const c of candidates) {
      try { if (fs.existsSync(c)) { pythonExe = c; break; } } catch(_) {}
    }
    if (!pythonExe) return null;
    
    return new Promise((resolve) => {
      const child = proc.spawn(pythonExe, [workerScript, "conditions", filePath], {
        env: { ...process.env, PSYCHOPY_NO_GUI: '1', MPLBACKEND: 'Agg' },
        timeout: 10000,
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on('data', (d) => stdout += d.toString());
      child.stderr.on('data', (d) => stderr += d.toString());
      child.on('close', () => {
        try { resolve(JSON.parse(stdout.trim().split('\n').pop())); }
        catch(_) { resolve(null); }
      });
      child.on('error', () => resolve(null));
    });
  });
  
  ipcMain.handle("python.psychojs.browserRun", async (evt, jsCode, expName, conditionsJSON, resourcesJSON, expDir, psyexpPath) => {
    console.log("[psychojs-browser] browserRun called, jsCode length:", jsCode?.length, "expName:", expName, "expDir:", expDir, "psyexpPath:", psyexpPath);
    try {
      const psychoJSBrowser = require("./psychojs-browser/index.cjs");
      
      // ★ If we have a .psyexp path, try Python generation first
      if (psyexpPath && fs.existsSync(psyexpPath)) {
        console.log("[psychojs-browser] Trying Python generation for:", psyexpPath);
        const genResult = await new Promise((resolve) => {
          const workerScript = path.join(__dirname, "python", "psychopy_worker.py");
          
          // Find Python
          let pythonExe = null;
          const pyCandidates = [
            path.join(__dirname, "..", "..", "python", "python.exe"),
            "D:\\PsychoPy\\python.exe",
            "/data/service/hnp/python.org/python_3.12/bin/python3",  // HarmonyOS HNP
            "/storage/Users/currentUser/.local/bin/python3",  // HarmonyOS user
            "/usr/bin/python3",
            "/system/bin/python3",
          ];
          for (const c of pyCandidates) {
            try { if (fs.existsSync(c)) { pythonExe = c; break; } } catch(_) {}
          }
          if (!pythonExe) {
            try { pythonExe = proc.execSync("which python3", { timeout: 3000, encoding: 'utf8' }).trim(); } catch(_) {}
          }
          
          if (!pythonExe || !fs.existsSync(pythonExe)) {
            console.log("[psychojs-browser] No Python found, falling back to manual exporter");
            resolve(null);
            return;
          }
          
          const outDir = path.join(app.getPath("temp"), "psychopy-oh-gen-" + Date.now());
          // Write the already-built ESM experiment.js to a temp file so the
          // Python worker can assemble the directory without depending on a
          // fragile headless psychopy compile.
          const jsTmp = path.join(app.getPath("temp"), "psychopy-oh-js-" + Date.now() + ".js");
          try { fs.writeFileSync(jsTmp, jsCode || "", "utf8"); } catch (_) {}
          console.log("[psychojs-browser] Spawning Python:", pythonExe, workerScript);
          
          const child = proc.spawn(pythonExe, [workerScript, "generate", psyexpPath, outDir, jsTmp], {
            cwd: path.dirname(workerScript),
            env: { ...process.env, PSYCHOPY_NO_GUI: '1', MPLBACKEND: 'Agg' },
            timeout: 30000,
          });
          
          let stdout = "";
          let stderr = "";
          child.stdout.on('data', (d) => stdout += d.toString());
          child.stderr.on('data', (d) => { stderr += d.toString(); console.log("[psychojs-browser] Python stderr:", d.toString().trim()); });
          child.on('close', (code) => {
            console.log(`[psychojs-browser] Python exited code=${code}`);
            if (stderr) console.log(`[psychojs-browser] Python stderr: ${stderr.slice(0, 500)}`);
            try {
              const result = JSON.parse(stdout.trim().split('\n').pop());
              if (result.status === 'ok') {
                console.log(`[psychojs-browser] Python generated: ${result.experiment_name}`);
                resolve(result);
              } else {
                console.error('[psychojs-browser] Python error:', result.error);
                resolve(null);
              }
            } catch(e) {
              console.error('[psychojs-browser] Parse failed:', e.message);
              resolve(null);
            }
          });
          child.on('error', (e) => {
            console.error('[psychojs-browser] Spawn error:', e.message);
            resolve(null);
          });
        });
        
        if (genResult && genResult.output_dir) {
          // ★ Use the Python-generated directory directly
          const url = await psychoJSBrowser.startServerFromDir(genResult.output_dir);
          console.log("[psychojs-browser] Opened (Python-generated):", url);
          openBrowserUrl(url);
          return url;
        }
      }
      
      // Fallback: use the manual JS code path
      const url = await psychoJSBrowser.startServer(
        jsCode || "", expName || "experiment", conditionsJSON || "",
        resourcesJSON || "", expDir || ""
      );
      console.log("[psychojs-browser] Opened in system browser:", url);
      openBrowserUrl(url);
      return url;
    } catch (err) {
      console.error("[psychojs-browser] Failed:", err?.message || err, err?.stack);
      throw err;
    }
  });
  // 保存实验 log（暂未启用）
  ipcMain.handle("python.psychojs.saveLog", async (evt, logData, savePath) => {
    const psychoJSBrowser = require("./psychojs-browser/index.cjs");
    return await psychoJSBrowser.saveLog(logData, savePath);
  });
  // ★ 停掉浏览器实验 server + 清理
  ipcMain.handle("python.psychojs.browserStop", async (evt, address) => {
    console.log("[psychojs-browser] browserStop called, address:", address);
    try {
      const psychoJSBrowser = require("./psychojs-browser/index.cjs");
      await psychoJSBrowser.stopServer(address);
      return true;
    } catch (err) {
      console.error("[psychojs-browser] stop failed:", err?.message || err);
      return false;
    }
  });
  // psychojs handlers are registered by python/index.js
  const { handlers: gitHandlers } = gitModule;
  if (gitModule && gitModule.handlers) _registration.git = true;

  console.log('[D] esm loaded isDev=' + isDev);
  console.log('[D] __dirname=' + __dirname);
  console.log('[D] dist exists=' + fs.existsSync(path.join(__dirname, '../../dist')));

  // figure out best file to use for a favicon
  var favicon = path.join(__dirname, 'favicon')
  if (process.platform === "win32") {
    favicon += ".ico"
  } else if (process.platform === "darwin") {
    favicon += ".icns"
  } else {
    favicon += "@1024x1024.png"
  }

  var svelte = {
    address: {
      host: "localhost",
      port: 8003,
    },
    process: undefined
  };
  var windows = {
    splash: undefined
  };

  // redirect app gubbins to a subfolder so it's distinct from user data
  app.setPath("userData", path.join(app.getPath("appData"), "psychopy4", ".node"))

  // load prefs from a JSON (if there is one)
  let prefsFile = path.join(app.getPath("appData"), "psychopy4", "preferences.json");
  let prefs
  if (fs.existsSync(prefsFile)) {
    prefs = JSON.parse(
      fs.readFileSync(prefsFile)
    )
  } else {
    prefs = {}
  }

  // setup a clipboard
  clipboard = undefined

  // send usage stats
  let usageReport = new UsageReport()
  usageReport.send()

  // setup listener for file open
  function onFileOpen(evt, file) {
    if (!file) {
      // do nothing if no file
      return
    }
    if (file.endsWith(".psyexp")) {
      // open psyexp in Builder
      newWindow(`builder?fileOpen=${file}`, true, false)
    } else if (startFile.endsWith(".psyrun")) {
      // open psyrun in Runner
      newWindow(`runner?fileOpen=${file}`, true, false)
    } else {
      // log anything else and leave default
      logging.error(`Requested file is not a PsychoPy file (.psyexp or .psyrun): ${process.argv[1]}`)
    }
  }
  app.on("open-file", onFileOpen)

  var started = false

  const createWindow = () => {
  console.log('[D] createWindow loading builder');
  started = true;

  const express = require('express');
  const expressApp = express();
  const distPath = path.join(__dirname, '../../dist');
  expressApp.use(express.static(distPath, {
    setHeaders: (res, p) => {
      if (p.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
      if (p.endsWith('.ttf')) res.setHeader('Content-Type', 'font/ttf');
      if (p.endsWith('.woff2')) res.setHeader('Content-Type', 'font/woff2');
      if (p.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
      if (p.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    }
  }));
  expressApp.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.includes('.')) return next();
    const pageDir = path.join(distPath, req.path.split('/')[1] || '', 'index.html');
    if (fs.existsSync(pageDir)) return res.sendFile(pageDir);
    next();
  });
  
  const server = expressApp.listen(8003, 'localhost', () => {
    console.log('[D] Express started');
    
    const mainWin = new BrowserWindow({
      width: 1600, height: 900, show: true,
      frame: true,
      webPreferences: { preload: path.join(__dirname, 'preload.js') }
    });
    mainWin.removeMenu();
    mainWin.loadURL('http://localhost:8003/builder');

    // Route ANY window.open(...) (e.g. Psychopy homepage, Help, Pavlovia links
    // in the menu) to the system browser via shell.openExternal. On HarmonyOS
    // an Electron child window created by window.open does not display, so we
    // deny the in-app window and open the URL in the OS default browser
    // instead. This reuses the same main-process shell.openExternal that already
    // works for "Run in browser" (electron.files.openExternal).
    mainWin.webContents.setWindowOpenHandler(({ url }) => {
      try { shell.openExternal(url); }
      catch (e) { console.error('[mainWin] openExternal failed for', url, e); }
      return { action: 'deny' };
    });

    // Store window for IPC
    mainWin.webContents.once('did-finish-load', () => {
      windows[mainWin.webContents.id] = mainWin;
    });
    
    svelte.process = { kill: () => server.close() };
  });
};/**
   * Open the default starting windows indicated by prefs
   */
  function startingWindows() {
    let targets
    try {
      targets = JSON.parse(prefs.params?.defaultView?.val)
    } catch {
      targets = ["builder"]
    }
    for (let target of targets) {
      newWindow(target, true, false).then(
        // show tips if requested
        id => windows[id].webContents.send(
          "showTips", prefs.params?.showStartupTips?.val === "True"
        )
      )
    }
  }


  async function newWindow(target = null, show = true, fullscreen = false) {
    // create window
    let win = new BrowserWindow({
      icon: favicon,
      width: 1600,
      height: 900,
      show: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    });
    win.removeMenu();
    // prevent default key behaviour for CMD+R
    win.webContents.on("before-input-event", (evt, input) => {
      if (input.modifiers.includes("meta") && input.key.toLowerCase() === "r") {
        evt.preventDefault()
      }
    })
    // open new windows in browser unless opened by electron
    win.webContents.setWindowOpenHandler(
      ({ url }) => {
        shell.openExternal(url);

        return { action: 'deny' }
      }
    )

    // load target URL
    let url = `http://${svelte.address.host}:${svelte.address.port}/${target || ''}`;
    logging.log(`Loading ${url}...`)
    win.loadURL(url);
    // store handle against id
    windows[win.webContents.id] = win;
    // create promise waiting for ready event
    let ready = Promise.withResolvers()
    // show when ready (if requested)
    win.once("ready-to-show", evt => {
      logging.log(`Loaded ${url}`)
      ready.resolve(win.webContents.id)
      if (show) {
        if (fullscreen) {
          win.maximize();
        }
        win.focus();
        if (windows.splash && !windows.splash.isDestroyed()) {
          windows.splash.close()
        }
        if (prefs?.params?.debugMode?.val === "True") {
          win.webContents.openDevTools();
        }
      }
    })
    // wait until ready
    return await ready.promise
  }


  /**
   * Opens a new BrowserWindow to login to Pavlovia, and waits for it to have a code in the URL
   * 
   * @param {string} url Authentication URL to use
   * @param {string} pattern Regex pattern we expect to be able to use to get the auth code
   */
  async function authenticatePavlovia(url) {
    // create window
    let win = new BrowserWindow({
      icon: favicon,
      width: 980,
      height: 720,
      show: true
    });
    win.removeMenu();
    // Clear all storage data to force fresh login
    await win.webContents.session.clearStorageData({
      storages: ['cookies', 'localstorage', 'sessionstorage', 'cachestorage', 'websql', 'indexdb']
    });
    // load auth url
    win.loadURL(url);
    // construct promise for the auth code
    let code = Promise.withResolvers()
    // on navigate, resolve if we have a code
    win.webContents.on("did-navigate", (evt, url) => {
      // search the URL for the auth code
      let params = new URLSearchParams(
        url.replace(/https:\/\/.*?(?=\?)/, "")
      )
      // if we got one...
      if (params.get("code")) {
        // resolve the promise
        code.resolve(
          params.get("code")
        )
        // close the window
        win.close()
      }
    })

    return code.promise
  }


  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow();
    // Request Desktop/Documents/Downloads access on HarmonyOS (popup shows once).
    // Fire-and-forget: grant applies to later fs reads (e.g. run-in-browser).
    requestDirectoryPermission();

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  // make sure the Svelte process is killed on exit
  process.on('SIGINT', app.quit);
  process.on('SIGTERM', app.quit);
  app.on("quit", (evt, code) => {
    // close svelte
    svelte.process.kill(0);
  })


  function getFileTree(folder, recursive = false) {
    let output = [];

    try {
      for (let item of fs.readdirSync(folder, { recursive: false })) {
        // construct absolute path
        let abspath = path.join(folder, item);
        // get stats
        let stats = fs.statSync(abspath);
        // construct details
        let details = {
          relpath: item,
          abspath: abspath,
        }
        if (stats.isDirectory()) {
          // if directory, recursively get children
          details.children = getFileTree(abspath)
        } else {
          // if file, get size
          details.size = stats.size / 1000000
        }
        // append
        output.push(details)
      }
    } catch (err) {
      console.error(err)

      return output
    }

    return output
  }

  /* handlers which can be invoked by electron */

  // cross-window state cache (persists at the main process level)
  let crossWindowState = {};

  const handlers = {
    electron: {
      windows: {
        new: ipcMain.handle("electron.windows.new", async (evt, target) => await newWindow(target)),
        get: ipcMain.handle("electron.windows.get", (evt, target) => Object.keys(windows).filter(
          id => windows[id] && typeof windows[id].isDestroyed === 'function' && !windows[id].isDestroyed()
        ).filter(
          id => String(windows[id].webContents.getURL()).includes(target)
        )),
        send: ipcMain.handle("electron.windows.send", (evt, id, tag, data) => {
          if (windows[id]) windows[id].webContents.send(tag, data)
        }),
        focus: ipcMain.handle("electron.windows.focus", (evt, id) => {
          let win = windows[id || evt.sender.id]
          if (win && win.focus) win.focus()
        }),
        state: {
          save: ipcMain.handle("electron.windows.state.save", (evt, key, data) => {
            crossWindowState[key] = data;
          }),
          load: ipcMain.handle("electron.windows.state.load", (evt, key) => {
            return crossWindowState[key] || null;
          })
        },
        devtools: ipcMain.handle("electron.windows.devtools", (evt, id) => {
          let win = windows[id || evt.sender.id]
          if (win && win.openDevTools) win.openDevTools()
        }),
        close: ipcMain.handle("electron.windows.close", (evt, id) => {
          let win = windows[id || evt.sender.id]
          if (win && win.close) win.close()
        }),
        minimize: ipcMain.handle("electron.windows.minimize", (evt, id) => {
          let win = windows[id || evt.sender.id]
          if (win && win.minimize) win.minimize()
        }),
        maximize: ipcMain.handle("electron.windows.maximize", (evt, id) => {
          let win = windows[id || evt.sender.id]
          if (win && win.maximize) win.maximize()
        }),
        navigate: ipcMain.handle("electron.windows.navigate", (evt, target) => {
          let win = windows[evt.sender.id]
          if (win && win.loadURL) win.loadURL(`http://localhost:8003/${target}`)
        }),
      },
      paths: {
        documents: ipcMain.handle("electron.paths.documents", (evt) => app.getPath("documents")),
        user: ipcMain.handle("electron.paths.user", (evt) => path.join(app.getPath("appData"), "psychopy4")),
        devices: ipcMain.handle("electron.paths.devices", (evt) => path.join(app.getPath("appData"), "psychopy4", "devices.json")),
        prefs: ipcMain.handle("electron.paths.prefs", (evt) => prefsFile),
        pavlovia: {
          dir: ipcMain.handle("electron.paths.pavlovia", (evt) => path.join(app.getPath("appData"), "psychopy4", "pavlovia")),
          users: ipcMain.handle("electron.paths.pavlovia.users", (evt) => path.join(app.getPath("appData"), "psychopy4", "pavlovia", "users.json")),
          projects: ipcMain.handle("electron.paths.pavlovia.projects", (evt) => path.join(app.getPath("appData"), "psychopy4", "pavlovia", "projects.json")),
        }
      },
      files: {
        load: ipcMain.handle("electron.files.load", (evt, file) => fs.readFileSync(file, { encoding: 'utf8' })),
        save: ipcMain.handle("electron.files.save", (evt, file, content) => fs.writeFileSync(file, content, { encoding: 'utf8', mode: 0o777 })),
        exists: ipcMain.handle("electron.files.exists", (evt, file) => fs.existsSync(file)),
        stat: ipcMain.handle("electron.files.stat", (evt, file) => {
          let stat = fs.statSync(file)
          return Object.assign({
            isDirectory: stat.isDirectory(),
            isFile: stat.isFile()
          }, stat)
        }),
        mkdir: ipcMain.handle("electron.files.mkdir", (evt, path, recursive = true) => fs.mkdirSync(path, { recursive: recursive })),
        openDialog: ipcMain.handle("electron.files.openDialog", (evt, options) => dialog.showOpenDialogSync(windows[evt.sender.id], options)),
        saveDialog: ipcMain.handle("electron.files.saveDialog", (evt, options) => dialog.showSaveDialogSync(windows[evt.sender.id], options)),
        scandir: ipcMain.handle("electron.files.scandir", (evt, root, recursive) => fs.readdirSync(root, { recursive: recursive }).sort(
          (a, b) => fs.statSync(path.join(root, b)).isDirectory() - fs.statSync(path.join(root, a)).isDirectory()
        )),
        showItemInFolder: ipcMain.handle("electron.files.showItemInFolder", (evt, folder) => shell.showItemInFolder(folder)),
        openPath: ipcMain.handle("electron.files.openPath", (evt, path) => shell.openPath(path)),
        openExternal: ipcMain.handle("electron.files.openExternal", async (evt, url) => {
          return openBrowserUrl(url);
        })
      },
      clipboard: {
        get: ipcMain.handle("electron.clipboard.get", (evt) => clipboard),
        set: ipcMain.handle("electron.clipboard.set", (evt, value) => clipboard = value)
      },
      permissions: {
        openSettings: ipcMain.handle("electron.permissions.openSettings", () => openApplicationInfoEntry())
      },
      authenticatePavlovia: ipcMain.handle("electron.authenticatePavlovia", (evt, url) => authenticatePavlovia(url)),
      version: ipcMain.handle("electron.version", (evt) => appVersion),
      platform: ipcMain.handle("electron.platform", (evt) => process.platform),
      quit: ipcMain.handle("electron.quit", (evt) => app.quit())
    },
    python: pythonHandlers,
    git: gitHandlers
  };

  // make sure user folder exists
  if (!fs.existsSync(
    path.join(app.getPath("appData"), "psychopy4")
  )) {
    fs.mkdirSync(
      path.join(app.getPath("appData"), "psychopy4"),
      { recursive: true }
    )
  }
})();
