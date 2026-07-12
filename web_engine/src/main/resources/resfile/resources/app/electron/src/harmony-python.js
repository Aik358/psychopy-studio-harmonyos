/**
 * harmony-python.js — HarmonyOS Python Backend Integration
 *
 * Replaces uv/venv-based Python discovery with direct system Python usage.
 * Uses liaison_shim.py instead of liaison-py (no Rust dependency).
 */

import fs from "fs";
import path from "path";
import proc from "child_process";
import { app, ipcMain } from "electron";
import logging from "./logging.js";
import { output, decoder } from "./python/utils.js";

// ── HarmonyOS Python paths ──────────────────────────────────
const HARMONY_PYTHON_PATHS = [
  "/data/service/hnp/python.org/python_3.12/bin/python3",
  "/data/service/hnp/python.org/python_3.11/bin/python3",
  "/usr/bin/python3",
  "/system/bin/python3",
];

// Path to liaison_shim.py
const SHIM_PATH = path.join(__dirname, "python", "liaison_shim.py");

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
    env: {
      ...process.env,
      PSYCHOPY_NO_GUI: "1",
      MPLBACKEND: "Agg",
    },
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
    env: {
      ...process.env,
      PSYCHOPY_NO_GUI: "1",
      MPLBACKEND: "Agg",
      PYTHONUNBUFFERED: "1",
    },
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
        logging.error(`Auto-start liaison failed: ${err}`);
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
    try {
      proc.execSync(`"${getPython()}" -m pip install --user ${name}`, { timeout: 60000 });
      return true;
    } catch (err) {
      logging.error(`pip install ${name} failed: ${err}`);
      return false;
    }
  });
  ipcMain.handle("python.venv.uninstallPackage", async (evt, venv, name) => {
    try {
      proc.execSync(`"${getPython()}" -m pip uninstall -y ${name}`, { timeout: 30000 });
      return true;
    } catch (_) { return false; }
  });
  ipcMain.handle("python.venv.getPackages", () => {
    try {
      const resp = proc.execSync(`"${getPython()}" -m pip list --format json`, { timeout: 15000, encoding: "utf8" });
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
      env: { ...process.env, PSYCHOPY_NO_GUI: "1", MPLBACKEND: "Agg" },
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
      env: {
        ...process.env,
        PSYCHOPY_NO_GUI: "1",
        MPLBACKEND: "Agg",
        PYTHONUNBUFFERED: "1",
      },
    });

    _shellProcesses.set(id, term);
    logging.log(`Terminal ${id} started with ${pythonPath}`);

    return id;
  });

  ipcMain.handle("terminal.python.send", (evt, id, msg) => {
    const term = _shellProcesses.get(id);
    if (!term) throw new Error(`Terminal ${id} not found`);
    term.stdin.write(msg);
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
      const result = proc.execSync(`"${pythonPath}" -c "${code.replace(/"/g, '\\"')}"`, {
        timeout: 15000,
        encoding: "utf8",
        env: { ...process.env, PSYCHOPY_NO_GUI: "1", MPLBACKEND: "Agg" },
      });
      return result;
    } catch (err) {
      return err.stderr || err.message || String(err);
    }
  });

  ipcMain.handle("terminal.python.diagnose", async () => {
    const pythonPath = getPython();
    const diag = {
      python: pythonPath,
      version: null,
      psychopy: null,
      packages: {},
      liaison: _liaisonReady ? "running" : "not started",
      liaisonAddress: _liaisonAddress,
    };

    try {
      diag.version = proc.execSync(`"${pythonPath}" --version`, { timeout: 5000, encoding: "utf8" }).trim();
    } catch (_) {}

    try {
      diag.psychopy = proc.execSync(`"${pythonPath}" -c "import psychopy; print(psychopy.__version__)"`, { timeout: 10000, encoding: "utf8" }).trim();
    } catch (e) {
      diag.psychopy = `FAILED: ${e.message}`;
    }

    try {
      const resp = proc.execSync(`"${pythonPath}" -c "import json,importlib.metadata; print(json.dumps({d.metadata['Name']: d.version for d in importlib.metadata.distributions()}))"`, { timeout: 15000, encoding: "utf8" }).trim();
      diag.packages = JSON.parse(resp);
    } catch (_) {}

    return JSON.stringify(diag, null, 2);
  });

  logging.log("HarmonyOS Python handlers registered");
}
