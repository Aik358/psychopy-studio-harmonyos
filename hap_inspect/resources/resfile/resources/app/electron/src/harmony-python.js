/**
 * harmony-python.js — HarmonyOS Python Backend Integration
 *
 * Replaces uv/venv-based Python discovery with direct system Python usage.
 * Uses liaison_shim.py instead of liaison-py (no Rust dependency).
 */

import fs from "fs";
import os from "os";
import path from "path";
import net from "net";
import crypto from "crypto";
import proc from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { app, ipcMain, BrowserWindow } from "electron";
import logging from "./logging.js";
import { output, decoder } from "./python/utils.js";

// ESM polyfill for __dirname (Node 20.x)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ESM 没有 require，用 createRequire 同步加载 CJS 模块（node:ws / ws 包）
const require_ = createRequire(import.meta.url);

// ── Minimal WebSocket 实现（纯 Node.js 内置模块，无外部依赖）──
// Electron-OH 没有 globalThis.WebSocket，也没有 node:ws / ws 包。
// 用 net（TCP）+ crypto（key）实现 WebSocket RFC 6455 协议。
// 支持 wsOn() 的 addEventListener 和 .on('message') 两种接口。
class MinimalWebSocket {
  // readyState 常量（RFC 6455 §4.1）— sendLiaison 行 438 检测 readyState === OPEN
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this._listeners = {};
    this._connected = false;
    this.readyState = MinimalWebSocket.CONNECTING;  // ← sendLiaison 要读
    this._buffer = Buffer.alloc(0);
    this._closed = false;
    this._connect();
  }

  // 故意不实现 addEventListener — wsOn() 优先用 addEventListener 但包装 (evt) => handler(evt.data)
  // 期望 Event 对象，本实现的 handler 直接收到 payload 字符串。让 wsOn 检测
  // typeof addEventListener === "undefined" 自动降级到 .on 路径（直接传 args[0]）。
  removeEventListener(event, handler) {
    const arr = this._listeners[event];
    if (arr) { const i = arr.indexOf(handler); if (i >= 0) arr.splice(i, 1); }
  }
  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }

  _emit(event, ...args) {
    const arr = this._listeners[event];
    if (arr) { for (const h of arr) h(...args); }
  }

  _connect() {
    let hostname = "localhost", port = 80, path = "/";
    try {
      const u = new URL(this.url);
      hostname = u.hostname;
      port = parseInt(u.port, 10) || (u.protocol === "wss:" ? 443 : 80);
      path = u.pathname + u.search;
    } catch (_) {
      // fallback: parse "localhost:8002" format
      const m = this.url.match(/ws:\/\/(.+?):(\d+)(\/.*)?$/);
      if (m) { hostname = m[1]; port = parseInt(m[2], 10); path = m[3] || "/"; }
    }

    const key = crypto.randomBytes(16).toString("base64");
    this._socket = net.createConnection(port, hostname, () => {
      const req = [
        `GET ${path} HTTP/1.1`,
        `Host: ${hostname}:${port}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "",
        "",
      ].join("\r\n");
      this._socket.write(req);
    });

    this._socket.on("data", (chunk) => {
      if (!this._connected) {
        const resp = chunk.toString("utf8");
        if (resp.includes(" 101 ")) {
          this._connected = true;
          this.readyState = MinimalWebSocket.OPEN;  // ← sendLiaison 检测 readyState === OPEN
          const hdrEnd = resp.indexOf("\r\n\r\n") + 4;
          if (hdrEnd > 4 && chunk.length > hdrEnd) {
            this._buffer = chunk.slice(hdrEnd);
            this._processFrames();
          }
          this._emit("open");
        } else {
          const err = new Error(`WS upgrade failed: ${resp.substring(0, 120)}`);
          this._emit("error", err);
        }
      } else {
        this._buffer = Buffer.concat([this._buffer, chunk]);
        this._processFrames();
      }
    });
    this._socket.on("error", (err) => { this._emit("error", err); });
    this._socket.on("close", () => {
      if (!this._closed) {
        this._closed = true;
        this.readyState = MinimalWebSocket.CLOSED;
        this._emit("close");
      }
    });
  }

  _processFrames() {
    while (this._buffer.length >= 2) {
      const b0 = this._buffer[0], b1 = this._buffer[1];
      const opcode = b0 & 0x0F;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7F, off = 2;
      if (len === 126) { if (this._buffer.length < 4) return; len = this._buffer.readUInt16BE(2); off = 4; }
      if (len === 127) { if (this._buffer.length < 10) return; len = Number(this._buffer.readBigUInt64BE(2)); off = 10; }
      const maskLen = masked ? 4 : 0;
      if (this._buffer.length < off + maskLen + len) return;
      const maskKey = masked ? this._buffer.slice(off, off + 4) : null;
      let payload = this._buffer.slice(off + maskLen, off + maskLen + len);
      if (masked && maskKey) { for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i % 4]; }
      this._buffer = this._buffer.slice(off + maskLen + len);

      if (opcode === 0x1) { this._emit("message", payload.toString("utf8")); }
      else if (opcode === 0x8) { this._socket.end(); this._closed = true; this._emit("close"); }
      else if (opcode === 0x9) { this._sendFrame(0xA, Buffer.alloc(0)); }
    }
  }

  _sendFrame(opcode, payload) {
    const buf = Buffer.from(payload, "utf8");
    const maskKey = crypto.randomBytes(4);
    const masked = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) masked[i] = buf[i] ^ maskKey[i % 4];
    let header;
    if (buf.length < 126) {
      header = Buffer.alloc(6); header[0] = 0x80 | opcode; header[1] = 0x80 | buf.length; maskKey.copy(header, 2);
    } else if (buf.length < 65536) {
      header = Buffer.alloc(8); header[0] = 0x80 | opcode; header[1] = 0x80 | 126; header.writeUInt16BE(buf.length, 2); maskKey.copy(header, 4);
    } else {
      header = Buffer.alloc(14); header[0] = 0x80 | opcode; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(buf.length), 2); maskKey.copy(header, 10);
    }
    this._socket.write(Buffer.concat([header, masked]));
  }

  send(data) { this._sendFrame(0x1, data); }
  close() {
    if (!this._closed) {
      this.readyState = MinimalWebSocket.CLOSING;
      this._sendFrame(0x8, Buffer.alloc(0));
      this._socket.end();
      this._closed = true;
      this.readyState = MinimalWebSocket.CLOSED;
      this._emit("close");
    }
  }
}

// ── WebSocket 兜底 ─────────────────────────────────────────
// Electron-OH 没有全局 WebSocket，也没有 node:ws / ws 包。
// 三级降级：globalThis.WebSocket → node:ws → MinimalWebSocket
logging.log(`[harmony-python] WebSocket probe: globalThis.WebSocket=${typeof globalThis.WebSocket}`);
let WebSocketImpl = globalThis.WebSocket || null;
if (!WebSocketImpl) {
  try {
    const wsMod = require_("node:ws");
    WebSocketImpl = wsMod.WebSocket || wsMod.default || wsMod;
    logging.log(`[harmony-python] Using node:ws WebSocket (type=${typeof WebSocketImpl})`);
  } catch (e1) {
    logging.log(`[harmony-python] node:ws not available (${e1?.message || e1}), trying MinimalWebSocket`);
    // 用纯 Node.js 内置模块实现 WebSocket client
    WebSocketImpl = MinimalWebSocket;
  }
}
const WebSocket = WebSocketImpl;
logging.log(`[harmony-python] WebSocket const resolved: ${WebSocket ? "OK" : "NULL"}`);

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
  // HarmonyBrew Cellar 的 C 库（libsndfile 等）加进 LD_LIBRARY_PATH
  // 鸿蒙系统 Python 缺 libsndfile.so → soundfile import 失败 → getAllComponents 报错
  // HarmonyBrew 装了 libsndfile 1.2.2_1，但 linker 默认不搜 Cellar 路径
  // 必须在父进程 spawn Python 时就设好，子进程内 os.environ 设太晚 linker 已搜完
  const hbLibPaths = [
    path.join(os.homedir(), ".harmonybrew", "Cellar", "libsndfile", "1.2.2_1", "lib"),
    path.join(os.homedir(), ".harmonybrew", "lib"),
  ].filter(p => { try { return fs.existsSync(p); } catch (_) { return false; } });
  const existingLdPath = process.env.LD_LIBRARY_PATH || "";
  const ldLibraryPath = [...hbLibPaths, ...existingLdPath.split(':').filter(Boolean)].join(':');
  return {
    ...process.env,
    PSYCHOPY_NO_GUI: "1",
    MPLBACKEND: "Agg",
    PYTHONUNBUFFERED: "1",
    PYTHONPATH: pythonpath,
    LD_LIBRARY_PATH: ldLibraryPath,
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
 * wsOn — 统一两种 WebSocket 实现的事件订阅 API
 *
 * - 浏览器 / Node 22+ 原生 WebSocket：用 .addEventListener(name, handler)
 *   事件对象 evt.data 取数据
 * - node:ws / ws 包的 WebSocket：用 .on('name', handler)
 *   handler 直接收到 (data, isBinary) 参数
 *
 * 自动检测 ws 实例支持哪种 API，统一以 (dataRaw) 回调形式触发 handler。
 * handler 收到原始 data（可能是 Buffer / ArrayBuffer / string）。
 */
function wsOn(ws, eventName, handler) {
  // 优先用 addEventListener（浏览器 / Node22 原生 WebSocket）
  if (typeof ws.addEventListener === "function") {
    ws.addEventListener(eventName, (evt) => handler(evt.data));
    return;
  }
  // 降级到 EventEmitter .on（node:ws / ws 包）
  if (typeof ws.on === "function") {
    // ws 包的 'message' 回调签名是 (data, isBinary)，'open'/'error' 无参或 1 参
    ws.on(eventName, (...args) => {
      if (eventName === "message") {
        handler(args[0]);  // args[0] = data (Buffer 或 string)
      } else {
        handler(args[0]);  // 'error' 的 Error，'open' 的 undefined
      }
    });
    return;
  }
  logging.error(`[wsOn] WebSocket instance has neither addEventListener nor .on (event: ${eventName})`);
}

/**
 * Start the liaison shim process and connect via WebSocket.
 */
async function startLiaison() {
  // ★ 每次启动先杀旧进程，确保新 HAP 的代码生效
  // 旧 liaison 进程不会随 HAP 更新自动退出，用户手动 kill 不可靠
  if (_liaisonProcess) {
    logging.log("Liaison already running, restarting...");
    await stopLiaison();
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
      // 同步到前端 SetupPython 窗（"uv" 通道）+ 通用 stdout 通道（terminal/pythonErrors）
      output("stdout", text);
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send("uv", text);
      }

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
      // 包成前端 PythonErrors.svelte 期望的 {error: "string"} 结构
      // 前端行 52 取 err.content.error 拼字符串显示，必须是 string 不能嵌套对象
      output("stderr", { error: text });
      // 同步 liaison:error 通道给前端 python.liaison.listen("error", ...)
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send("liaison:error", { error: text });
        // SetupPython 窗同样要看 stderr（"uv" 通道）
        win.webContents.send("uv", text);
      }
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
  logging.log(`[startLiaison] liaison_shim started, address=${_liaisonAddress}, now opening WebSocket`);

  let ws;
  try {
    ws = new WebSocket(`ws://${_liaisonAddress}`);
    logging.log(`[startLiaison] new WebSocket returned: ${ws ? typeof ws : 'null'}`);
  } catch (newErr) {
    logging.error(`[startLiaison] new WebSocket THREW: ${newErr?.message || newErr}`);
    logging.error(`[startLiaison] Stack: ${newErr?.stack?.substring(0, 300)}`);
    throw newErr;
  }

  await new Promise((resolve, reject) => {
    wsOn(ws, "open", () => {
      logging.log("[startLiaison] wsOn 'open' fired — WebSocket connected");
      resolve();
    });
    wsOn(ws, "error", (err) => {
      logging.error(`[startLiaison] wsOn 'error' fired: ${err}`);
      reject(err);
    });
    setTimeout(() => reject(new Error("WebSocket connection timeout (5s)")), 5000);
  });

  _liaisonSocket = ws;
  logging.log("[startLiaison] _liaisonSocket set, attaching message handler");

  wsOn(ws, "message", (rawData) => {
    let data = rawData;
    if (data instanceof Buffer) {
      data = decoder.decode(data);
    } else if (data instanceof ArrayBuffer) {
      data = decoder.decode(new Uint8Array(data));
    }
    try {
      const msg = JSON.parse(data);
      if (msg.evt && msg.evt.id && _pendingMessages.has(msg.evt.id)) {
        const { resolve, reject } = _pendingMessages.get(msg.evt.id);
        _pendingMessages.delete(msg.evt.id);
        if ("response" in msg) {
          resolve(msg.response);
        } else {
          // liaison 命令报错 — 同步到前端 PythonErrors 窗（"stderr" 通道）
          // msg.error 形如 {message, traceback}，前端 err.content.error 要 string，拼成可读字符串
          const errStr = msg.error?.message
            ? (msg.error.message + (msg.error.traceback ? "\n" + msg.error.traceback : ""))
            : JSON.stringify(msg.error || msg);
          output("stderr", { error: errStr });
          for (const win of BrowserWindow.getAllWindows()) {
            win.webContents.send("liaison:error", { error: errStr });
          }
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
  logging.log(`[startLiaison] SUCCESS — _liaisonReady=true, address=${_liaisonAddress}`);
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
  // Return a promise that resolves with output (matching original PythonShell.send API)
  return new Promise((resolve) => {
    let output = "";
    const onData = (data) => { output += decoder.decode(data); };
    const onEnd = () => {
      shell.stdout.removeListener("data", onData);
      shell.stderr.removeListener("data", onData);
      // Filter REPL noise and return sanitized output
      const lines = output.split("\n")
        .filter(l => !l.startsWith(">>>") && !l.includes("###") && l.trim())
        .map(l => l.trim());
      resolve(lines);
    };
    shell.stdout.on("data", onData);
    shell.stderr.on("data", onData);
    // Send the command with end marker
    shell.stdin.write(`${msg}\nprint("###END###")\n`);
    // Wait for end marker, timeout after 2s
    const checkEnd = (data) => {
      if (decoder.decode(data).includes("###END###")) {
        shell.stdout.removeListener("data", checkEnd);
        onEnd();
      }
    };
    shell.stdout.on("data", checkEnd);
    setTimeout(onEnd, 5000);
  });
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
    logging.log(`[python.liaison.send] sending command: ${JSON.stringify(message).substring(0, 200)}`);
    try {
      const result = await sendLiaison(message, timeout);
      logging.log(`[python.liaison.send] response: ${JSON.stringify(result).substring(0, 200)}`);
      return result;
    } catch (err) {
      logging.error(`[python.liaison.send] error: ${err.message || err}`);
      throw err;
    }
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

  // UV — 鸿蒙不用 uv 包管理器，但前端 SetupPython 流程依赖这些 IPC
  // 不 stub 假返回，改真行为：用鸿蒙系统 Python 直接，错误真出到 terminal
  ipcMain.handle("python.uv.exists", () => {
    // 真检查 Python 可用
    try { return fs.existsSync(getPython()); } catch (_) { return false; }
  });
  ipcMain.handle("python.uv.folder", () => {
    // 真返回 Python 所在目录（非 uv folder，但前端只用来显示）
    return path.dirname(getPython());
  });
  ipcMain.handle("python.uv.executable", () => getPython());
  ipcMain.handle("python.uv.install", async () => {
    // 鸿蒙不用 uv，但前端 SetupPython 流程调它做"安装 Python"步骤
    // 真行为：检查 Python 存在即可，不存在则错误到 terminal
    const py = getPython();
    if (!fs.existsSync(py)) {
      const msg = `[uv.install] Python not found at ${py}`;
      output("stderr", { error: msg });
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", msg);
      return false;
    }
    const okMsg = `[uv.install] Python ready at ${py}`;
    output("stdout", okMsg);
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", okMsg);
    return true;
  });
  ipcMain.handle("python.uv.makeExecutable", async () => {
    // 真行为：Python 已可执行，返回路径
    const py = getPython();
    try { proc.execSync(`"${py}" --version`, { env: getPythonEnv(), timeout: 10000 }); return py; }
    catch (err) {
      const msg = `[uv.makeExecutable] Python not executable: ${err.message}`;
      output("stderr", { error: msg });
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", msg);
      return null;
    }
  });
  ipcMain.handle("python.uv.findPython", async () => {
    // 真行为：返回 Python 路径或 null
    const py = getPython();
    return fs.existsSync(py) ? py : null;
  });
  ipcMain.handle("python.uv.getEnvironments", async () => {
    // 真行为：返回鸿蒙系统 Python 作为唯一环境
    const py = getPython();
    if (!fs.existsSync(py)) return [];
    try {
      const ver = proc.execSync(`"${py}" --version`, { env: getPythonEnv(), encoding: "utf8", timeout: 10000 }).trim();
      return [{ name: "system", path: py, version: ver }];
    } catch (err) {
      const msg = `[uv.getEnvironments] Failed to probe Python: ${err.message}`;
      output("stderr", { error: msg });
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", msg);
      return [];
    }
  });

  // Venv — 鸿蒙用系统 Python 直接，但前端 SetupPython 流程调 venv.setup
  // 不 stub 假返回 true，改真行为：验证 Python 可用，错误真出到 terminal
  ipcMain.handle("python.venv.setup", async () => {
    const py = getPython();
    try {
      const ver = proc.execSync(`"${py}" --version`, { env: getPythonEnv(), encoding: "utf8", timeout: 10000 }).trim();
      const msg = `[venv.setup] Using system Python: ${ver} at ${py}`;
      output("stdout", msg);
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", msg);
      return true;
    } catch (err) {
      const msg = `[venv.setup] Python setup failed: ${err.stderr || err.message}`;
      output("stderr", { error: msg });
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", msg);
      return false;
    }
  });
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
      const arr = JSON.parse(resp);
      // Convert array [{name, version}, ...] to object {name: version} for frontend compat
      const packages = {};
      for (const item of arr) {
        if (item.name) {
          packages[item.name] = item.version || '';
        }
      }
      return packages;
    } catch (err) {
      _flog && _flog('[getPackages] pip list failed:', err && err.message);
      return {};
    }
  });
  ipcMain.handle("python.venv.getPackageDetails", async (evt, venv, name) => {
    // 真行为：用 pip show 拿包详情，错误真出到 terminal
    const pyEnv = getPythonEnv();
    try {
      const resp = proc.execSync(`"${getPython()}" -m pip show ${name}`, { timeout: 15000, encoding: "utf8", env: pyEnv });
      // pip show 输出 KV 行，转对象
      const details = {};
      for (const line of resp.split("\n")) {
        const m = line.match(/^([\w-]+):\s*(.*)$/);
        if (m) details[m[1].toLowerCase()] = m[2];
      }
      return details;
    } catch (err) {
      const msg = `[venv.getPackageDetails] pip show ${name} failed: ${err.stderr || err.message}`;
      output("stderr", { error: msg });
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", msg);
      return {};
    }
  });

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
    // ★ diagnose 主动启动 liaison，不被动等前端调 liaison.ready
    // 前端 diagnose 是入口，一次调用触发 liaison 起来，_liaisonReady 置 true，后续功能不再 stub
    if (!_liaisonReady) {
      try {
        logging.log("[diagnose] Auto-starting liaison...");
        await startLiaison();
        logging.log(`[diagnose] startLiaison returned, _liaisonReady=${_liaisonReady}, _liaisonAddress=${_liaisonAddress}`);
      } catch (err) {
        logging.error(`[diagnose] Auto-start liaison failed: ${err?.message || err}`);
        logging.error(`[diagnose] Stack: ${err?.stack?.substring(0, 300)}`);
      }
    }
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

  // ── PsychoJS server helpers ─────────────────────────────────
  const _psychojsServers = {};

  async function _startPsychoJS(cwd) {
    const pythonPath = getPython();
    // 动态找空闲端口 — liaison 已占 8002，从 8003 递增避免 `Address in use`
    // net.createServer().listen() 是异步的，错误在回调；用同步的 listen + 'error' 事件判断
    // listen 同步抛 EADDRINUSE 很快；不抛就是空闲（还没真正监听但 OS 会先做 bind 检查）
    let port = 8003;
    while (port < 8100) {
      const testServer = net.createServer();
      const isFree = await new Promise((resolve) => {
        testServer.once("error", () => resolve(false));
        testServer.listen(port, "localhost", () => {
          testServer.close(() => resolve(true));
        });
      });
      if (isFree) break;
      port++;
    }
    const server = proc.spawn(pythonPath, [
      "-m", "http.server", String(port), "--directory", cwd || os.tmpdir()
    ], {
      stdio: ["pipe", "pipe", "pipe"],
      env: getPythonEnv(),
    });

    const id = `psychojs-${++_processCounter}`;
    server.stdout.on("data", (data) => output("psychojs", decoder.decode(data)));
    server.stderr.on("data", (data) => {
      const text = decoder.decode(data);
      output("stderr", { error: text });  // 包成前端期望结构让 PythonErrors 窗能显示
      logging.error(`PsychoJS server stderr: ${text}`);
    });
    server.on("error", (err) => logging.error(`PsychoJS server error: ${err}`));
    server.on("close", () => {
      delete _psychojsServers[id];
      _shellProcesses.delete(id);
    });

    _psychojsServers[id] = { process: server, address: `localhost:${port}` };
    _shellProcesses.set(id, server);
    logging.log(`PsychoJS server ${id} started at localhost:${port}`);
    return { address: `localhost:${port}`, id };
  }

  function _stopPsychoJS(address) {
    for (const [id, srv] of Object.entries(_psychojsServers)) {
      if (srv.address === address || id === address) {
        srv.process.kill();
        _shellProcesses.delete(id);
        delete _psychojsServers[id];
        return true;
      }
    }
    return false;
  }

  // ── PsychoJS IPC handlers ────────────────────────────────────
  ipcMain.handle("python.psychojs.run", async (evt, cwd) => _startPsychoJS(cwd));

  ipcMain.handle("python.psychojs.stop", (evt, address) => _stopPsychoJS(address));

  ipcMain.handle("python.psychojs.browserRun", async (evt, jsCode, expName, conditionsJSON, resourcesJSON, expDir) => {
    try {
      const runDir = path.join(os.tmpdir(), "psychojs_run", expName || "experiment");
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, "index.html"), jsCode || "", "utf8");
      if (conditionsJSON) fs.writeFileSync(path.join(runDir, "conditions.json"), conditionsJSON, "utf8");
      if (resourcesJSON) fs.writeFileSync(path.join(runDir, "resources.json"), resourcesJSON, "utf8");
      return await _startPsychoJS(runDir);
    } catch (err) {
      logging.error(`browserRun failed: ${err}`);
      return { error: String(err) };
    }
  });

  ipcMain.handle("python.psychojs.saveLog", async (evt, logData, savePath) => {
    try {
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(savePath, typeof logData === "string" ? logData : JSON.stringify(logData, null, 2), "utf8");
      return true;
    } catch (err) {
      logging.error(`saveLog failed: ${err}`);
      return false;
    }
  });

  ipcMain.handle("python.psychojs.browserStop", (evt, address) => _stopPsychoJS(address));

  ipcMain.handle("python.psychojs.readConditions", async (evt, filePath) => {
    try {
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath, "utf8");
      try { return JSON.parse(content); } catch (_) { return content; }
    } catch (err) {
      logging.error(`readConditions failed: ${err}`);
      return null;
    }
  });

  logging.log("HarmonyOS Python handlers registered");
}
