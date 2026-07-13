/**
 * harmony-python.js — HarmonyOS Python Backend Integration
 *
 * Replaces uv/venv-based Python discovery with direct system Python usage.
 * Uses liaison_shim.py instead of liaison-py (no Rust dependency).
 */

import fs from "fs";
import os from "os";
import path from "path";
import proc from "child_process";
import { fileURLToPath } from "url";
import { app, ipcMain, BrowserWindow } from "electron";
import logging from "./logging.js";
import { output, decoder } from "./python/utils.js";

// ESM polyfill for __dirname (Node 20.x)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── HarmonyOS Python paths ──────────────────────────────────
const HARMONY_PYTHON_PATHS = [
  "/data/service/hnp/python.org/python_3.12/bin/python3",
  "/data/service/hnp/python.org/python_3.11/bin/python3",
  "/usr/bin/python3",
  "/system/bin/python3",
];

// Path to liaison_shim.py
const SHIM_PATH = path.join(__dirname, "python", "liaison_shim.py");

// ── HarmonyOS Python site-packages paths ────────────────────
// On HarmonyOS, Python packages may be installed in non-standard paths.
// We need to set PYTHONPATH to include all possible site-packages locations.
const HARMONY_SITE_PACKAGES = [
  "/data/service/hnp/python.org/python_3.12/lib/python3.12/site-packages",
  "/data/service/hnp/python.org/python_3.12/lib/python3.12/dist-packages",
  path.join(__dirname, "python", "lib"),
  "/data/data/com.example.electron/files/python/lib/python3.12/site-packages",
];

function getPythonEnv() {
  const existingPath = process.env.PYTHONPATH || "";
  const extraPaths = HARMONY_SITE_PACKAGES.filter(p => {
    try { return fs.existsSync(p); } catch (_) { return false; }
  });
  const pythonpath = [...extraPaths, ...existingPath.split(':').filter(Boolean)].join(':');
  return {
    ...process.env,
    PSYCHOPY_NO_GUI: "1",
    MPLBACKEND: "Agg",
    PYTHONUNBUFFERED: "1",
    PYTHONPATH: pythonpath,
    // Prevent OpenBLAS from spawning threads that trigger SECCOMP violations
    OPENBLAS_NUM_THREADS: "1",
    OMP_NUM_THREADS: "1",
    MKL_NUM_THREADS: "1",
    NUMEXPR_NUM_THREADS: "1",
    OPENBLAS_MAIN_FREE: "1",
  };
}

let _pythonPath = null;
let _liaisonProcess = null;
let _liaisonAddress = null;
let _liaisonSocket = null;
let _liaisonReady = false;
let _pendingMessages = new Map();
let _shellProcesses = new Map();
let _processCounter = 0;

/**
 * Find Python executable on HarmonyOS.
 */
function findPython() {
  if (_pythonPath) return _pythonPath;

  const envPy = process.env.PSYCHOPY_PYTHON;
  if (envPy && fs.existsSync(envPy)) {
    _pythonPath = envPy;
    return _pythonPath;
  }

  for (const p of HARMONY_PYTHON_PATHS) {
    try {
      if (fs.existsSync(p)) {
        const ver = proc.execSync(`"${p}" --version`, { timeout: 5000, encoding: "utf8" }).trim();
        logging.log(`Found Python: ${p} (${ver})`);
        _pythonPath = p;
        return p;
      }
    } catch (_) {}
  }

  try {
    const w = proc.execSync("which python3", { timeout: 3000, encoding: "utf8" }).trim();
    if (w && fs.existsSync(w)) {
      _pythonPath = w;
      return w;
    }
  } catch (_) {}

  return null;
}

function getPython() {
  const p = findPython();
  if (!p) {
    throw new Error("Python3 not found on this system. Please install Python 3.9+ via HNP or harmonybrew.");
  }
  return p;
}

/**
 * Start the liaison shim process and connect via WebSocket.
 */
async function startLiaison() {
  if (_liaisonProcess) {
    logging.log("Liaison already running");
    return _liaisonAddress;
  }

  const pythonPath = getPython();
  logging.log(`Starting liaison_shim.py with ${pythonPath}`);

  _liaisonProcess = proc.spawn(pythonPath, [SHIM_PATH], {
    stdio: ["pipe", "pipe", "pipe"],
    env: getPythonEnv(),
  });

  const startPromise = new Promise((resolve, reject) => {
    let stdoutBuf = "";
    const timeout = setTimeout(() => {
      reject(new Error("Liaison startup timed out (10s)"));
    }, 10000);

    _liaisonProcess.stdout.on("data", (data) => {
      const text = decoder.decode(data);
      stdoutBuf += text;
      output("stdout", text);

      const lines = stdoutBuf.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("LIAISON_START@")) {
          _liaisonAddress = trimmed.substring("LIAISON_START@".length);
          clearTimeout(timeout);
          logging.log(`Liaison started at ${_liaisonAddress}`);
          resolve(_liaisonAddress);
          return;
        }
      }
    });

    _liaisonProcess.stderr.on("data", (data) => {
      const text = decoder.decode(data);
      output("stderr", text);
      logging.error(`Liaison stderr: ${text}`);
    });

    _liaisonProcess.on("close", (code) => {
      logging.log(`Liaison process exited with code ${code}`);
      _liaisonProcess = null;
      _liaisonReady = false;
      clearTimeout(timeout);
    });
  });

  await startPromise;

  const ws = new WebSocket(`ws://${_liaisonAddress}`);

  await new Promise((resolve, reject) => {
    ws.onopen = () => {
      logging.log("Liaison WebSocket connected");
      resolve();
    };
    ws.onerror = (err) => {
      logging.error(`Liaison WebSocket error: ${err}`);
      reject(err);
    };
    setTimeout(() => reject(new Error("WebSocket connection timeout")), 5000);
  });

  _liaisonSocket = ws;

  ws.addEventListener("message", (evt) => {
    let data = evt.data;
    if (data instanceof Buffer) {
      data = decoder.decode(data);
    }
    try {
      const msg = JSON.parse(data);
      if (msg.evt && msg.evt.id && _pendingMessages.has(msg.evt.id)) {
        const { resolve, reject } = _pendingMessages.get(msg.evt.id);
        _pendingMessages.delete(msg.evt.id);
        if ("response" in msg) {
          resolve(msg.response);
        } else {
          reject(msg.error || msg);
        }
      } else if (msg.evt) {
        // Forward non-response events to renderer (alerts, notifications, etc.)
        const evtName = msg.evt.name || String(msg.evt);
        if (evtName === "alert" && msg.message) {
          // Send alert in format frontend expects: { message: { code, cat, msg } }
          for (const win of BrowserWindow.getAllWindows()) {
            win.webContents.send("alert", { message: msg.message });
          }
        } else {
          output(evtName, JSON.stringify(msg));
        }
      }
    } catch (_) {}
  });

  _liaisonReady = true;
  return _liaisonAddress;
}

async function sendLiaison(command, timeout = 30000) {
  if (!_liaisonSocket || _liaisonSocket.readyState !== WebSocket.OPEN) {
    throw new Error("Liaison not connected");
  }

  const msgid = crypto.randomUUID();
  const msg = { command, id: msgid };

  return new Promise((resolve, reject) => {
    _pendingMessages.set(msgid, { resolve, reject });
    _liaisonSocket.send(JSON.stringify(msg));

    if (timeout) {
      setTimeout(() => {
        if (_pendingMessages.has(msgid)) {
          _pendingMessages.delete(msgid);
          reject(new Error(`Liaison command timed out: ${JSON.stringify(command).substring(0, 100)}`));
        }
      }, timeout);
    }
  });
}

async function stopLiaison() {
  if (_liaisonSocket) {
    _liaisonSocket.close();
    _liaisonSocket = null;
  }
  if (_liaisonProcess) {
    _liaisonProcess.kill();
    _liaisonProcess = null;
  }
  _liaisonReady = false;
  _liaisonAddress = null;
}

// ── Shell management ────────────────────────────────────────

function openShell() {
  const pythonPath = getPython();
  const id = `shell-${++_processCounter}`;

  const shell = proc.spawn(pythonPath, ["-i", "-u"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: getPythonEnv(),
  });

  _shellProcesses.set(id, shell);

  shell.stdout.on("data", (data) => output("stdout", decoder.decode(data)));
  shell.stderr.on("data", (data) => output("stderr", decoder.decode(data)));
  shell.on("close", (code) => {
    logging.log(`Shell ${id} exited with code ${code}`);
    _shellProcesses.delete(id);
  });

  return id;
}

function sendShell(id, msg) {
  const shell = _shellProcesses.get(id);
  if (!shell) throw new Error(`Shell ${id} not found`);
  shell.stdin.write(msg + "\n");
  return "";
}

function closeShell(id) {
  const shell = _shellProcesses.get(id);
  if (shell) {
    shell.kill();
    _shellProcesses.delete(id);
  }
  return true;
}

function listShells() {
  return Array.from(_shellProcesses.keys());
}

// ── Register IPC handlers ───────────────────────────────────

export function registerHarmonyPythonHandlers() {
  // Liaison
  ipcMain.handle("python.liaison.start", async () => {
    try {
      await startLiaison();
      return true;
    } catch (err) {
      logging.error(`Failed to start liaison: ${err}`);
      return false;
    }
  });

  ipcMain.handle("python.liaison.stop", async () => {
    await stopLiaison();
    return true;
  });

  ipcMain.handle("python.liaison.send", async (evt, venv, message, timeout) => {
    return await sendLiaison(message, timeout);
  });

  ipcMain.handle("python.liaison.started", () => _liaisonProcess !== null);

  ipcMain.handle("python.liaison.ready", async () => {
    if (!_liaisonProcess) {
      try {
        await startLiaison();
      } catch (err) {
        logging.error(`Auto-start liaison failed: ${err?.message || err}`);
        return false;
      }
    }
    let waited = 0;
    while (!_liaisonReady && waited < 10000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }
    return _liaisonReady;
  });

  // UV stubs (not used on HarmonyOS, but frontend expects them)
  ipcMain.handle("python.uv.exists", () => true);
  ipcMain.handle("python.uv.folder", () => "/tmp/harmony-python");
  ipcMain.handle("python.uv.executable", () => getPython());
  ipcMain.handle("python.uv.install", () => Promise.resolve(true));
  ipcMain.handle("python.uv.makeExecutable", () => Promise.resolve(getPython()));
  ipcMain.handle("python.uv.findPython", () => Promise.resolve(getPython()));
  ipcMain.handle("python.uv.getEnvironments", () => Promise.resolve([]));

  // Venv (use system Python directly)
  ipcMain.handle("python.venv.setup", () => Promise.resolve(true));
  ipcMain.handle("python.venv.executable", () => getPython());
  ipcMain.handle("python.venv.installPackage", async (evt, venv, name) => {
    const pyEnv = getPythonEnv();
    const cmd = `"${getPython()}" -m pip install ${name} --no-input`;
    output("stdout", `Installing ${name}...\n`);
    try {
      const result = proc.execSync(cmd, { timeout: 120000, encoding: "utf8", env: pyEnv });
      output("stdout", result + "\n");
      return true;
    } catch (err) {
      const msg = err.stderr || err.stdout || err.message || String(err);
      output("stderr", `pip install failed: ${msg}\n`);
      return false;
    }
  });
  ipcMain.handle("python.venv.uninstallPackage", async (evt, venv, name) => {
    const pyEnv = getPythonEnv();
    try {
      proc.execSync(`"${getPython()}" -m pip uninstall -y ${name}`, { timeout: 30000, env: pyEnv });
      return true;
    } catch (_) { return false; }
  });
  ipcMain.handle("python.venv.getPackages", () => {
    const pyEnv = getPythonEnv();
    try {
      const resp = proc.execSync(`"${getPython()}" -m pip list --format json`, { timeout: 15000, encoding: "utf8", env: pyEnv });
      return JSON.parse(resp);
    } catch (_) { return []; }
  });
  ipcMain.handle("python.venv.getPackageDetails", () => Promise.resolve({}));

  // Shell
  ipcMain.handle("python.shell.list", () => listShells());
  ipcMain.handle("python.shell.send", (evt, venv, id, msg) => sendShell(id, msg));
  ipcMain.handle("python.shell.open", () => openShell());
  ipcMain.handle("python.shell.close", (evt, venv, id) => closeShell(id));

  // Scripts
  ipcMain.handle("python.scripts.run", async (evt, venv, file, ...args) => {
    const pythonPath = getPython();
    const script = proc.spawn(pythonPath, [file, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
      env: getPythonEnv(),
    });
    const id = `script-${++_processCounter}`;
    _shellProcesses.set(id, script);

    script.stdout.on("data", (data) => output("stdout", decoder.decode(data)));
    script.stderr.on("data", (data) => output("stderr", decoder.decode(data)));
    script.on("close", (code) => {
      logging.log(`Script ${id} exited with code ${code}`);
      _shellProcesses.delete(id);
    });

    return id;
  });
  ipcMain.handle("python.scripts.finished", async (evt, venv, id) => {
    const script = _shellProcesses.get(id);
    if (!script) return;
    return new Promise(resolve => script.on("close", () => resolve()));
  });
  ipcMain.handle("python.scripts.stop", (evt, venv, id) => {
    const script = _shellProcesses.get(id);
    if (script) {
      script.kill();
      _shellProcesses.delete(id);
    }
    return true;
  });

  // ── Terminal IPC ──────────────────────────────────────────
  ipcMain.handle("terminal.python.start", async () => {
    const pythonPath = getPython();
    const id = `term-${++_processCounter}`;

    const term = proc.spawn(pythonPath, ["-i", "-u"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: getPythonEnv(),
    });

    // Forward stdout/stderr to renderer so terminal shows output
    term.stdout.on("data", (data) => output("stdout", decoder.decode(data)));
    term.stderr.on("data", (data) => output("stderr", decoder.decode(data)));
    term.on("close", (code) => {
      output("stdout", `\n[Process exited with code ${code}]\n`);
    });
    term.on("error", (err) => {
      output("stderr", `\n[Error: ${err.message}]\n`);
    });

    _shellProcesses.set(id, term);
    logging.log(`Terminal ${id} started with ${pythonPath}`);

    return id;
  });

  ipcMain.handle("terminal.python.send", (evt, id, msg) => {
    const term = _shellProcesses.get(id);
    if (!term) throw new Error(`Terminal ${id} not found`);
    // Ensure command ends with newline so Python REPL executes it
    const input = msg.endsWith("\n") ? msg : msg + "\n";
    term.stdin.write(input);
    return true;
  });

  ipcMain.handle("terminal.python.close", (evt, id) => {
    const term = _shellProcesses.get(id);
    if (term) {
      term.kill();
      _shellProcesses.delete(id);
    }
    return true;
  });

  ipcMain.handle("terminal.python.exec", async (evt, code) => {
    const pythonPath = getPython();
    try {
      // Use stdin pipe instead of -c to avoid quoting issues
      const result = proc.execSync(`"${pythonPath}" -i -u`, {
        input: code + '\n',
        timeout: 15000,
        encoding: "utf8",
        env: getPythonEnv(),
      });
      // Filter out Python REPL noise (banner, >>> prompts)
      const lines = result.split('\n').filter(l => 
        !l.startsWith('>>>') && 
        !l.startsWith('...') && 
        !l.includes('Python 3.') &&
        !l.includes('Type "help"') &&
        !l.includes('>>>')
      );
      return lines.join('\n').trim();
    } catch (err) {
      // execSync returns non-zero exit for some valid Python code (e.g. sys.exit)
      if (err.stdout) {
        const lines = err.stdout.split('\n').filter(l => 
          !l.startsWith('>>>') && !l.startsWith('...') &&
          !l.includes('Python 3.') && !l.includes('Type "help"')
        );
        return lines.join('\n').trim();
      }
      return err.stderr || err.message || String(err);
    }
  });

  ipcMain.handle("terminal.python.diagnose", async () => {
    const pythonPath = findPython();
    const diag = {
      python: pythonPath || "NOT FOUND",
      version: null,
      psychopy: null,
      packages: {},
      liaison: _liaisonReady ? "running" : "not started",
      liaisonAddress: _liaisonAddress,
      harmonyPaths: HARMONY_PYTHON_PATHS.map(p => ({ path: p, exists: fs.existsSync(p) })),
    };

    if (!pythonPath) {
      return JSON.stringify(diag, null, 2);
    }

    try {
      diag.version = proc.execSync(`"${pythonPath}" --version`, { timeout: 5000, encoding: "utf8" }).trim();
    } catch (_) {}

    try {
      diag.psychopy = proc.execSync(`"${pythonPath}" -c "import psychopy; print(psychopy.__version__)"`, { timeout: 10000, encoding: "utf8", env: getPythonEnv() }).trim();
    } catch (e) {
      diag.psychopy = `NOT AVAILABLE: ${e.message?.substring(0, 80) || e}`;
    }

    // Check key packages using a temp script file
    // Step 1: find_spec (safe, no import, no SECCOMP risk)
    // Step 2: try import for version (may fail for numpy/scipy due to OpenBLAS SECCOMP)
    const keyPkgs = ['numpy', 'scipy', 'matplotlib', 'PIL', 'pandas', 'websockets'];
    const pyEnv = getPythonEnv();
    const checkScript = [
      'import importlib.util as u',
      'pkgs = ' + JSON.stringify(keyPkgs),
      'for pkg in pkgs:',
      '    spec = u.find_spec(pkg)',
      '    if spec is None:',
      '        print(pkg + "=MISSING")',
      '    else:',
      '        try:',
      '            m = __import__(pkg)',
      '            v = getattr(m, "__version__", "found")',
      '            print(pkg + "=" + str(v))',
      '        except Exception as e:',
      '            print(pkg + "=FOUND(import_err:" + str(e)[:50] + ")")',
    ].join('\n');
    const tmpCheck = path.join(os.tmpdir(), '_psychopy_check.py');
    try { fs.writeFileSync(tmpCheck, checkScript, 'utf8'); } catch (_) {}
    try {
      const output = proc.execSync(`"${pythonPath}" "${tmpCheck}"`, { timeout: 15000, encoding: "utf8", env: pyEnv }).trim();
      for (const line of output.split('\n')) {
        const idx = line.indexOf('=');
        if (idx > 0) {
          const pkg = line.substring(0, idx);
          const ver = line.substring(idx + 1);
          if (pkg) diag.packages[pkg] = ver;
        }
      }
    } catch (_) {
      // If the script itself crashes (e.g. SECCOMP kills the process),
      // run find_spec only without any import
      const safeScript = [
        'import importlib.util as u',
        'pkgs = ' + JSON.stringify(keyPkgs),
        'for pkg in pkgs:',
        '    spec = u.find_spec(pkg)',
        '    print(pkg + "=" + ("FOUND" if spec else "MISSING"))',
      ].join('\n');
      try { fs.writeFileSync(tmpCheck, safeScript, 'utf8'); } catch (_) {}
      try {
        const output2 = proc.execSync(`"${pythonPath}" "${tmpCheck}"`, { timeout: 5000, encoding: "utf8", env: pyEnv }).trim();
        for (const line of output2.split('\n')) {
          const idx = line.indexOf('=');
          if (idx > 0) {
            const pkg = line.substring(0, idx);
            const ver = line.substring(idx + 1);
            if (pkg) diag.packages[pkg] = ver;
          }
        }
      } catch (_) {
        for (const pkg of keyPkgs) diag.packages[pkg] = "CHECK_FAILED";
      }
    }

    // Show Python sys.path for debugging
    try {
      diag.sysPath = proc.execSync(`"${pythonPath}" -c "import sys; print('\\n'.join(sys.path))"`, { timeout: 5000, encoding: "utf8", env: pyEnv }).trim().split('\n');
    } catch (_) {
      diag.sysPath = [];
    }
    diag.pythonpath = pyEnv.PYTHONPATH;

    return JSON.stringify(diag, null, 2);
  });

  logging.log("HarmonyOS Python handlers registered");
}
