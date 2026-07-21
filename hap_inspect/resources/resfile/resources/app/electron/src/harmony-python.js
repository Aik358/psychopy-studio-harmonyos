/**
 * harmony-python.js — HarmonyOS Python Backend Integration
 *
 * Replaces uv/venv-based Python discovery with direct system Python usage.
 * Uses liaison_shim.py instead of liaison-py (no Rust dependency).
 */

import fs from "fs";
import http from "http";
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
import * as Harmony from "./harmony.js";

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
  // 动态扫描 Cellar 目录，不硬编码版本号
  const realHome = os.homedir();
  const hbLibPaths = [
    path.join(realHome, ".harmonybrew", "lib"),
  ];
  // Scan libsndfile Cellar for available versions
  try {
    const cellarDir = path.join(realHome, ".harmonybrew", "Cellar", "libsndfile");
    if (fs.existsSync(cellarDir)) {
      const vers = fs.readdirSync(cellarDir).sort().reverse();
      for (const v of vers) {
        const libPath = path.join(cellarDir, v, "lib");
        if (fs.existsSync(libPath)) {
          hbLibPaths.unshift(libPath);
          break;
        }
      }
    }
  } catch (_) {}
  // Also try common non-Cellar harmonybrew lib path
  try {
    const altLib = path.join(realHome, ".harmonybrew", "lib");
    if (fs.existsSync(altLib) && !hbLibPaths.includes(altLib)) {
      hbLibPaths.push(altLib);
    }
  } catch (_) {}
  const existingLdPath = process.env.LD_LIBRARY_PATH || "";
  const ldLibraryPath = [...hbLibPaths, ...existingLdPath.split(':').filter(Boolean)].join(':');
  return {
    ...process.env,
    PSYCHOPY_NO_GUI: "1",
    MPLBACKEND: "Agg",
    PYTHONUNBUFFERED: "1",
    PYTHONPATH: pythonpath,
    LD_LIBRARY_PATH: ldLibraryPath,
    // Redirect HOME to sandbox so .psychopy3/themes/etc. are writable.
    // Desktop/Documents/Downloads access is handled by requestDirectoryPermission() in index.cjs.
    HOME: "/data/storage/el2/base/cache/home",
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

  // Try known paths first, then dynamically scan HNP directory
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

  // Dynamic scan: find all python.org versions under HNP
  try {
    const hnpBase = "/data/service/hnp/python.org";
    if (fs.existsSync(hnpBase)) {
      const dirs = fs.readdirSync(hnpBase);
      for (const d of dirs.sort().reverse()) {  // newest first
        const pyBin = path.join(hnpBase, d, "bin", "python3");
        if (fs.existsSync(pyBin)) {
          try {
            const ver = proc.execSync(`"${pyBin}" --version`, { timeout: 5000, encoding: "utf8" }).trim();
            logging.log(`Found Python (dyn): ${pyBin} (${ver})`);
            _pythonPath = pyBin;
            return pyBin;
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

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

  // Initialize liaison with prefs, alerts, and plugins
  // (matches official liaison.js start() lines 98-160)
  try {
    logging.log("[startLiaison] Initializing liaison services...");

    // setup alerts
    var hasAlerts = await sendLiaison({command: "exists", args: ["psychopy.alerts.liaison:LiaisonAlertHandler"]}, 10000).catch(() => false);
    if (hasAlerts) {
      await sendLiaison({command: "init", args: ["alerts", "psychopy.alerts.liaison:LiaisonAlertHandler"], kwargs: {liaison: "$liaison"}}, 30000).catch(() => {});
      await sendLiaison({command: "run", args: ["psychopy.alerts:addAlertHandler", "$alerts"]}, 30000).catch(() => {});
    }

    // setup prefs
    await sendLiaison({command: "register", args: ["prefs", "psychopy.preferences:prefs"]}, 10000).catch(
      err => logging.error(`[startLiaison] Failed to register prefs: ${err?.message || err}`)
    );
    // set devices file path
    var devicesPath = path.join(app.getPath("appData"), "psychopy4", "devices.json");
    await sendLiaison({command: "try", args: ["prefs.setDevicesFile", devicesPath]}, 10000).catch(() => {});
    // load preferences
    var prefsPath = path.join(app.getPath("appData"), "psychopy4", "preferences.json");
    if (fs.existsSync(prefsPath)) {
      await sendLiaison({command: "try", args: ["prefs.fromJSON", prefsPath]}, 10000).catch(() => {});
    }

    // activate plugins
    var hasPlugins = await sendLiaison({command: "exists", args: ["psychopy.plugins:activatePlugins"]}, 10000).catch(() => false);
    if (hasPlugins) {
      await sendLiaison({command: "run", args: ["psychopy.plugins:activatePlugins"]}, undefined).catch(() => {});
    }

    logging.log("[startLiaison] Liaison services initialized");
  } catch (err) {
    logging.error(`[startLiaison] Service init error (non-fatal): ${err?.message || err}`);
  }

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

  const rawResult = await new Promise((resolve, reject) => {
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
  // Post-process generated JS to fix Python syntax leaking into output
  if (typeof rawResult === "string" && rawResult.length > 100) {
    return _fixGeneratedJS(rawResult);
  }
  return rawResult;
}

/**
 * Fix Python syntax that leaks into the generated JavaScript.
 * The PsychoPy JS transpiler (py2js_transpiler.py) doesn't handle all
 * Python → JS conversions, leaving invalid JS in the output.
 */
function _fixGeneratedJS(jsCode) {
  var fixed = _fixPythonPercentFormatting(jsCode)
    // f'{randint(a, b):0Wd}' → String(util.randint(a,b)).padStart(W,'0')
    .replace(/f'\{randint\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*:\s*(\d+)d\s*\}'/g,
      function(match, minimum, maximum, width) {
        return "String(util.randint(" + minimum + "," + maximum + ")).padStart(" + Number(width) + ",'0')";
      })
    .replace(/f'\{randint\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*:\s*(\d+)\.(\d+)f\s*\}'/g,
      function(match, minimum, maximum, width) {
        return "String(parseInt(util.randint(" + minimum + "," + maximum + "))).padStart(" + Number(width) + ",'0')";
      })
    // Python None → JS undefined
    .replace(/\bNone\b/g, 'undefined')
    // Python False/True → JS false/true
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bTrue\b/g, 'true');

  // ESM module: PsychoPy's JS templates (JS_setupExp.tmpl, loops.py,
  // _base.py, _experiment.py, every Routine's init code) emit assignments
  // to a *large* set of variables WITHOUT ever declaring them. In a
  // classic <script> these become implicit globals on window; under
  // <script type="module"> strict mode they throw ReferenceError. Rather
  // than hand-maintaining a fixed list (which fails the first time a
  // routine-specific Clock, Component array, or keyboard _allKeys is
  // added), scan the whole script for bare-name assignments and inject a
  // single module-scope `var` declaration block listing every one.
  //
  // Safety: declaring a module-scope `var` for a variable that some
  // function also declares locally is harmless — the inner `var` shadows
  // the outer one. We only need to avoid re-declaring variables that the
  // transpiler already declared at module scope (let expName, const
  // {Scheduler}, etc.).
  var implicitGlobals = _scanImplicitGlobals(fixed);
  // Ensure critical variables are always declared even if scanner missed them.
  // currentLoop and frameDur are assigned inside updateInfo(); various Clocks
  // and Component arrays are assigned inside experimentInit() and each Routine.
  // The scanner catches most but may miss some due to code structure changes.
  var CRITICAL_GLOBALS = ['currentLoop', 'frameDur', 'globalClock', 'routineTimer',
    't', 'frameN', 'continueRoutine', 'routineForceEnded'];
  for (var i = 0; i < CRITICAL_GLOBALS.length; i++) {
    if (implicitGlobals.indexOf(CRITICAL_GLOBALS[i]) < 0) {
      implicitGlobals.push(CRITICAL_GLOBALS[i]);
    }
  }
  implicitGlobals.sort();
  if (implicitGlobals.length > 0) {
    fixed = fixed.replace(
      /(const\s+\{[^}]*Scheduler[^}]*\}\s*=\s*util\s*;)/,
      '$1\n' +
      'var ' + implicitGlobals.join(', ') + ';' +
      '  // bridged for ESM strict mode (PsychoPy templates rely on implicit globals)'
    );
  }
  return fixed;
}

// Scan a JS source string for identifiers that are assigned without a
// preceding `var`/`let`/`const`/`function`/`class`/`import`/`export`
// keyword, and are not already declared at module scope. Returns a
// de-duplicated, sorted array of identifier names.
//
// We deliberately over-match rather than under-match: the cost of a
// spurious module-scope `var` is nil (shadowed by any inner `var`), while
// the cost of missing one is a runtime ReferenceError that aborts the
// experiment.
function _scanImplicitGlobals(jsCode) {
  // Identifiers already declared at module scope by the transpiler or
  // imported via ESM `import`/`const { X } = Y`. We collect these by
  // scanning the source for declaration statements, then exclude them
  // from the implicit-globals result.
  var declared = {};
  // ESM imports: `import { a, b as c } from '...'` / `import defaultName from '...'`
  var importRe = /\bimport\s+(?:([A-Za-z_$][\w$]*)|(?:\{([^}]*)\}))\s*(?:,|from)\s/g;
  var im;
  while ((im = importRe.exec(jsCode)) !== null) {
    if (im[1]) declared[im[1]] = true;
    if (im[2]) {
      im[2].split(',').forEach(function(part) {
        var name = part.replace(/^[^:]*:\s*/, '').trim();
        // `a as b` → declared name is `b`
        var m = part.match(/\bas\s+([A-Za-z_$][\w$]*)/);
        if (m) declared[m[1]] = true;
        else if (name) declared[name] = true;
      });
    }
  }
  // All `var`/`let`/`const`/`function`/`class` declarations (any scope —
  // inner-scope var would shadow outer, so we treat any declared name as
  // "do not re-declare at module top" to keep the injected block short).
  var declRe = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\b/g;
  var dm;
  while ((dm = declRe.exec(jsCode)) !== null) declared[dm[1]] = true;
  var fnRe = /\bfunction\s+([A-Za-z_$][\w$]*)\b/g;
  var fm;
  while ((fm = fnRe.exec(jsCode)) !== null) declared[fm[1]] = true;
  var classRe = /\bclass\s+([A-Za-z_$][\w$]*)\b/g;
  var cm;
  while ((cm = classRe.exec(jsCode)) !== null) declared[cm[1]] = true;
  // Function parameter lists — also "declared" inside their scope.
  var paramRe = /\bfunction\s*[A-Za-z_$]*\s*\(([^)]*)\)/g;
  var pm;
  while ((pm = paramRe.exec(jsCode)) !== null) {
    pm[1].split(',').forEach(function(p) {
      var name = p.replace(/=[\s\S]*$/, '').replace(/\/\/.*$/, '').trim();
      // Strip type annotations / patterns; keep simple identifiers.
      var idMatch = name.match(/^([A-Za-z_$][\w$]*)/);
      if (idMatch) declared[idMatch[1]] = true;
    });
  }
  // Arrow-function params: `(a, b) => ...` or `x => ...`
  var arrowParamRe = /\(([^)]*)\)\s*=>/g;
  var apm;
  while ((apm = arrowParamRe.exec(jsCode)) !== null) {
    apm[1].split(',').forEach(function(p) {
      var idMatch = p.replace(/=[\s\S]*$/, '').trim().match(/^([A-Za-z_$][\w$]*)/);
      if (idMatch) declared[idMatch[1]] = true;
    });
  }
  var singleArrowRe = /\b([A-Za-z_$][\w$]*)\s*=>/g;
  var sam;
  while ((sam = singleArrowRe.exec(jsCode)) !== null) declared[sam[1]] = true;
  // `for (const X of ...)` / `for (let X = ...; ...)` loop vars.
  var forRe = /\bfor\s*\(\s*(?:var|let|const)\s+([A-Za-z_$][\w$]*)\b/g;
  var fom;
  while ((fom = forRe.exec(jsCode)) !== null) declared[fom[1]] = true;

  // Reserved words we never want to declare.
  var KEYWORDS = {
    'true': true, 'false': true, 'null': true, 'undefined': true,
    'this': true, 'arguments': true, 'window': true, 'document': true,
    'console': true, 'Math': true, 'Array': true, 'Object': true,
    'JSON': true, 'Number': true, 'String': true, 'Boolean': true,
    'Promise': true, 'Date': true, 'Error': true, 'TypeError': true,
    'RangeError': true, 'ReferenceError': true, 'SyntaxError': true,
    'NaN': true, 'Infinity': true, 'globalThis': true, 'self': true,
    'Symbol': true, 'BigInt': true, 'RegExp': true, 'FormData': true,
    'fetch': true, 'navigator': true, 'location': true,
    'return': true, 'if': true, 'else': true, 'for': true, 'while': true,
    'do': true, 'switch': true, 'case': true, 'break': true, 'continue': true,
    'throw': true, 'try': true, 'catch': true, 'finally': true,
    'typeof': true, 'instanceof': true, 'in': true, 'of': true, 'new': true,
    'delete': true, 'void': true, 'yield': true, 'async': true, 'await': true,
    'debugger': true, 'with': true, 'default': true, 'var': true, 'let': true,
    'const': true, 'function': true, 'class': true, 'import': true, 'export': true,
    'extends': true, 'super': true, 'static': true, 'get': true, 'set': true,
    'enum': true, 'public': true, 'private': true, 'protected': true, 'readonly': true,
    'namespace': true, 'module': true, 'declare': true, 'type': true, 'interface': true,
    'as': true, 'from': true, 'is': true, 'keyof': true, 'infer': true,
    'implements': true, 'package': true, 'abstract': true, 'satisfies': true,
    'override': true, 'accessor': true, 'out': true, 'constructor': true,
    'util': true, 'core': true, 'data': true, 'visual': true, 'sound': true,
    'hardware': true, 'PsychoJS': true, 'Scheduler': true, 'TrialHandler': true,
    'MultiStairHandler': true, 'StairHandler': true, 'QuestHandler': true,
    'ExperimentHandler': true, 'Shelf': true,
    'abs': true, 'sin': true, 'cos': true, 'sqrt': true, 'pi': true, 'round': true,
    'expName': true, 'expInfo': true, 'PILOTING': true, 'psychoJS': true,
  };

  // Match bare-name assignment LHS at the start of a line (allowing any
  // leading whitespace). We anchor on `^` + indent + identifier + ` = `
  // and reject when the identifier is followed by `.`/`[` (property access)
  // or when `=` is part of `==`/`===`/`=>`/`<=`/`>=`/`!=`/`!==`.
  //
  // The `m` flag makes `^` match line starts. We capture the identifier.
  var assignRe = /^\s*([A-Za-z_$][\w$]*)\s*(=(?![=>])|[\+\-\*\/%&|^]=|\+\+|--)\s/gm;
  var implicit = {};
  var am;
  while ((am = assignRe.exec(jsCode)) !== null) {
    var name = am[1];
    if (KEYWORDS[name]) continue;
    if (declared[name]) continue;
    implicit[name] = true;
  }

  // Also catch multi-target chained assignments where the first LHS is a
  // bare name: `a = b = c;` — the regex above already catches `a`, but
  // subsequent targets like `b` may sit mid-line. We handle the common
  // shape `name = name = value` by splitting on top-level `=` after the
  // first. This is rare in PsychoPy output, so we keep it best-effort.
  // (Skip: covered by the next pass below if the chained target starts a
  // new statement.)

  // Sort for deterministic output (helps debugging / diffs).
  return Object.keys(implicit).sort();
}

/**
 * Convert Python Unicode-string percent formatting emitted verbatim by
 * SettingsComponent.writeInitCodeJS / JS_setupExp.tmpl into a JS template
 * literal. A regular expression cannot safely consume the argument list:
 * expInfo['participant'] contains a nested `]`.
 */
function _fixPythonPercentFormatting(jsCode) {
  const formatStart = /\bu(['"])((?:\\.|[^])*?)\1\s*%\s*\[/g;
  let fixedCode = '';
  let copyFrom = 0;
  let match;

  while ((match = formatStart.exec(jsCode)) !== null) {
    const listStart = formatStart.lastIndex;
    const listEnd = _findPythonListEnd(jsCode, listStart);
    if (listEnd === -1) {
      continue;
    }

    const args = _splitPythonFormatArgs(jsCode.slice(listStart, listEnd));
    const template = _pythonPercentFormatToTemplate(match[2], args);
    if (template === null) {
      // Leave unknown formatting untouched instead of silently changing its
      // meaning. It remains visible in the generated script for diagnosis.
      continue;
    }

    fixedCode += jsCode.slice(copyFrom, match.index) + template;
    copyFrom = listEnd + 1;
    formatStart.lastIndex = copyFrom;
  }

  return fixedCode + jsCode.slice(copyFrom);
}

// listStart is immediately after the opening `[`. Find its matching `]` while
// respecting Python-style quoted dictionary keys and nested bracketed values.
function _findPythonListEnd(source, listStart) {
  let depth = 1;
  let quote = null;
  let escaped = false;

  for (let index = listStart; index < source.length; index++) {
    const character = source[index];
    if (quote !== null) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
    } else if (character === '[') {
      depth++;
    } else if (character === ']') {
      depth--;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function _splitPythonFormatArgs(source) {
  const args = [];
  let itemStart = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quote !== null) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
    } else if (character === '[' || character === '(' || character === '{') {
      depth++;
    } else if (character === ']' || character === ')' || character === '}') {
      depth--;
    } else if (character === ',' && depth === 0) {
      args.push(source.slice(itemStart, index).trim());
      itemStart = index + 1;
    }
  }

  const finalArg = source.slice(itemStart).trim();
  if (finalArg) {
    args.push(finalArg);
  }
  return args;
}

function _pythonPercentFormatToTemplate(format, args) {
  let argIndex = 0;
  let invalid = false;
  // Escape only literal text before adding `${...}` substitutions.
  const templateBody = format.replace(/`/g, '\\`').replace(/\$\{/g, '\\${').replace(
    /%(%|[-+ #0]*\d*(?:\.\d+)?[diouxXeEfFgGcrs])/g,
    function(token, specifier) {
      if (specifier === '%') {
        return '%';
      }
      if (argIndex >= args.length || !args[argIndex]) {
        invalid = true;
        return token;
      }
      const expression = _pythonExpressionToJS(args[argIndex++]);
      return '${' + expression + '}';
    }
  );

  // An unsupported percent directive, or a mismatch between directives and
  // list items, is safer left untouched than converted to a wrong filename.
  if (invalid || /%(?!%|[-+ #0]*\d*(?:\.\d+)?[diouxXeEfFgGcrs])/.test(format) || argIndex !== args.length) {
    return null;
  }

  return '`' + templateBody + '`';
}

function _pythonExpressionToJS(expression) {
  // Bracket access is valid JS, but dot access produces the expected output
  // for normal expInfo keys and is easier to read in generated experiments.
  return expression.replace(
    /\b([A-Za-z_$][\w$]*)\[['"]([A-Za-z_$][\w$]*)['"]\]/g,
    '$1.$2'
  );
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
  // ── 安全注册：先移除 python/index.js 可能已注册的同名 handler ──
  // ipcMain.handle() 对同一事件名注册两次会抛异常，导致后续 handler 全部不注册。
  // 解决方案：所有 handle 调用前先 removeHandler，确保不会重复注册。
  const _channelsToClear = [
    "python.liaison.start", "python.liaison.stop", "python.liaison.send",
    "python.liaison.started", "python.liaison.ready",
    "python.venv.setup", "python.venv.executable", "python.venv.installPackage",
    "python.venv.uninstallPackage", "python.venv.getPackages", "python.venv.getPackageDetails",
    "python.uv.folder", "python.uv.executable", "python.uv.exists",
    "python.uv.install", "python.uv.makeExecutable", "python.uv.findPython",
    "python.uv.getEnvironments",
    "python.shell.list", "python.shell.send", "python.shell.open", "python.shell.close",
    "python.scripts.run", "python.scripts.finished", "python.scripts.stop",
    "python.psychojs.run", "python.psychojs.stop",
  ];
  for (const ch of _channelsToClear) {
    try { ipcMain.removeHandler(ch); } catch (_) {}
  }
  logging.log("[harmony-python] Cleared " + _channelsToClear.length + " potentially duplicate handlers");

  // ── HarmonyOS runtime discovery (tablet detection, Python setup) ──
  ipcMain.handle("python.harmony.isHarmonyOS", () => Harmony.isHarmonyOS());
  ipcMain.handle("python.harmony.strategy", () => Harmony.getPythonStrategy());
  ipcMain.handle("python.harmony.nativePython", () => Harmony.findNativePython());
  ipcMain.handle("python.harmony.pythonVersion", () => {
    const p = Harmony.findNativePython();
    return p ? Harmony.getPythonVersion(p) : null;
  });
  ipcMain.handle("python.harmony.diagnose", () => Harmony.diagnosePythonEnvironment());
  ipcMain.handle("python.harmony.guidance", () => {
    const diag = Harmony.diagnosePythonEnvironment();
    return Harmony.generateSetupGuidance(diag);
  });
  ipcMain.handle("python.harmony.autoInstall", async () => {
    try {
      const diag = Harmony.diagnosePythonEnvironment();
      if (!diag.python || !diag.pythonOk) {
        return { success: false, error: "No suitable Python found", diag };
      }
      const { default: proc } = await import("child_process");
      const packages = diag.missingRequired || [];
      const results = [];
      for (const pkg of packages) {
        try {
          const args = ["-m", "pip", "install", "--no-input", "--quiet", pkg];
          proc.execSync([diag.python, ...args].join(" "), { timeout: 120000, encoding: "utf8" });
          results.push({ package: pkg, status: "ok" });
        } catch (e) {
          results.push({ package: pkg, status: "failed", error: String(e?.message || e).slice(0, 200) });
        }
      }
      return { success: results.every(r => r.status === "ok"), results, diag };
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
  });

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

  // Venv — HarmonyOS uses system Python directly. Verify psychopy is importable.
  ipcMain.handle("python.venv.setup", async () => {
    const py = getPython();
    const pyEnv = getPythonEnv();
    try {
      // Check Python exists
      const ver = proc.execSync(`"${py}" --version`, { env: pyEnv, encoding: "utf8", timeout: 10000 }).trim();
      output("stdout", `[setup] System Python: ${ver} at ${py}`);
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", `Python ${ver}`);
      // Verify psychopy is importable
      try {
        const pv = proc.execSync(`"${py}" -c "import psychopy; print(psychopy.__version__)"`, { env: pyEnv, encoding: "utf8", timeout: 30000 }).trim();
        output("stdout", `[setup] PsychoPy ${pv} is importable ✓`);
        for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", `PsychoPy ${pv} ✓`);
      } catch (e) {
        output("stderr", { error: `[setup] PsychoPy NOT importable. Run "pip install psychopy" to install.` });
        for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", `PsychoPy not found ✗`);
        return { success: false, missingPsychopy: true };
      }
      return { success: true };
    } catch (err) {
      const msg = `[setup] Python not found: ${err.stderr || err.message}`;
      output("stderr", { error: msg });
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", msg);
      return { success: false, missingPython: true };
    }
  });

  // Install all core PsychoPy dependencies in one go
  ipcMain.handle("python.venv.installAllDeps", async () => {
    const py = getPython();
    const pyEnv = getPythonEnv();
    const deps = ["psychopy==2026.1.2", "numpy", "scipy", "matplotlib", "pandas",
      "openpyxl", "pillow", "websockets", "soundfile", "imageio",
      "imageio-ffmpeg", "markdown-it-py", "packaging",
    ];
    const welcome = "PsychoPy 2026.1.2 — Environment Setup\n========================================\n";
    output("stdout", welcome);
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", welcome);
    let installed = 0, skipped = 0, failed = 0;
    for (const name of deps) {
      // Check if already installed (skip if version matches)
      let alreadyInstalled = false;
      try {
        const pkgName = name.split("==")[0];
        proc.execSync(`"${py}" -m pip show "${pkgName}"`, { timeout: 10000, encoding: "utf8", env: pyEnv });
        alreadyInstalled = true;
      } catch (_) {}
      
      if (alreadyInstalled) {
        skipped++;
        const skipMsg = `  ✓ ${name} (already installed)`;
        output("stdout", skipMsg);
        for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", skipMsg + "\n");
        continue;
      }
      
      installed++;
      const progress = `[${installed}/${deps.length - skipped}] Installing ${name}...`;
      output("stdout", progress);
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", progress + "\n");
      try {
        proc.execSync(`"${py}" -m pip install "${name}" --no-input --quiet`, { timeout: 180000, env: pyEnv });
        const okMsg = `  ✓ ${name} installed`;
        output("stdout", okMsg);
        for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", okMsg + "\n");
      } catch (err) {
        failed++;
        const errStr = (err.stderr || err.message || "").substring(0, 120);
        const failMsg = `  ✗ ${name} FAILED: ${errStr}`;
        output("stderr", { error: failMsg });
        for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", failMsg + "\n");
      }
    }
    const summary = `\nDone: ${installed} installed, ${skipped} skipped, ${failed} failed`;
    output("stdout", summary);
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send("uv", summary + "\n");
    return failed === 0;
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
    const keyPkgs = ['psychopy', 'numpy', 'scipy', 'matplotlib', 'PIL', 'pandas', 'websockets',
      'openpyxl', 'soundfile', 'imageio', 'imageio-ffmpeg', 'markdown_it', 'packaging'];
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

  // ── PsychoJS inline server ──────────────────────────────────
  const _psychojsServers = {};
  const _psychojsLibDir = path.join(__dirname, "psychojs-browser", "lib");

  function _psychojsReadLib(name) {
    return fs.readFileSync(path.join(_psychojsLibDir, name), "utf8");
  }

  function _psychojsBridgeScript() {
    return [
      '(function(){',
      '  var ns = window.PsychoJS;',
      '  if (!ns || typeof ns !== "object") {',
      '    document.body.innerHTML = "<pre style=\\"color:red;padding:20px\\">FATAL: PsychoJS IIFE not loaded</pre>";',
      '    return;',
      '  }',
      '  var RealPsychoJS = ns.core && ns.core.PsychoJS;',
      '  if (typeof RealPsychoJS !== "function") {',
      '    document.body.innerHTML = "<pre style=\\"color:red;padding:20px\\">FATAL: PsychoJS constructor not found</pre>";',
      '    return;',
      '  }',
      '  window.PsychoJS = RealPsychoJS;',
      '  window.util = ns.util;',
      '  window.visual = ns.visual;',
      '  window.core = ns.core;',
      '  window.data = ns.data;',
      '  window.sound = ns.sound;',
      '  window.hardware = ns.hardware;',
      '  window.Scheduler = ns.util.Scheduler;',
      '  window.TrialHandler = ns.data.TrialHandler;',
      '  window.MultiStairHandler = ns.data.MultiStairHandler;',
      '  for (var k in RealPsychoJS) {',
      '    if (RealPsychoJS.hasOwnProperty(k)) window.PsychoJS[k] = RealPsychoJS[k];',
      '  }',
      '  if (RealPsychoJS.prototype) window.PsychoJS.prototype = RealPsychoJS.prototype;',
      '})();',
    ].join('\n');
  }

  // Resource file extensions PsychoJS ServerManager may download at runtime.
  // Excludes .js (would overwrite experiment.js) and .psyexp/.py source files.
  var _RESOURCE_EXTS = [
    '.xlsx', '.xls', '.xlsm', '.csv', '.tsv', '.txt',
    '.json',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp',
    '.wav', '.mp3', '.ogg', '.flac', '.aac',
    '.mov', '.mp4', '.webm', '.ogv',
  ];
  var _RESOURCE_EXTS_SET = {};
  for (var _i = 0; _i < _RESOURCE_EXTS.length; _i++) {
    _RESOURCE_EXTS_SET[_RESOURCE_EXTS[_i]] = true;
  }

  /**
   * Copy experiment resource files (xlsx/csv/images/audio/json) into the
   * HTTP output directory `outDir` so PsychoJS ServerManager can fetch them.
   *
   * Strategy:
   *   1. Parse `resourcesJSON` (a JSON string of `[{rel, abs}, ...]`) and
   *      copy each `abs → outDir/rel`. This is the primary path because the
   *      frontend already enumerated the resources the experiment needs.
   *   2. Fallback: scan `expDir` (the .psyexp folder) for any file whose
   *      extension is in `_RESOURCE_EXTS` and copy it to `outDir` root.
   *      This catches resources the frontend list missed (e.g. multiple
   *      loops with different conditions files).
   *
   * Both steps are best-effort: missing source files and copy errors are
   * logged but do not abort the server startup.
   */
  function _copyExperimentResources(outDir, resourcesJSON, expDir) {
    var copied = {};
    function copyPair(src, relPath) {
      if (!src || !relPath) return;
      try {
        if (!fs.existsSync(src)) {
          logging.log("psychojs: resource source missing: " + src);
          return;
        }
        // Normalize the destination path: strip any "../" or absolute
        // prefix so the file lands inside outDir.
        var cleanRel = relPath.replace(/\\/g, '/').replace(/^\.\//, '');
        // Drop leading ".." segments for safety.
        while (cleanRel.indexOf('../') === 0 || cleanRel.indexOf('./') === 0) {
          cleanRel = cleanRel.replace(/^(?:\.\.\/|\.\/)/, '');
        }
        var dst = path.join(outDir, cleanRel);
        var dstDir = path.dirname(dst);
        if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
        // Don't overwrite experiment.js with a same-named resource.
        if (cleanRel === 'experiment.js' || cleanRel === 'index.html') {
          return;
        }
        fs.copyFileSync(src, dst);
        copied[cleanRel] = true;
        logging.log("psychojs: copied resource " + cleanRel + " from " + src);
      } catch (e) {
        logging.error("psychojs: failed to copy resource " + src + ": " + (e && e.message));
      }
    }

    // 1. Explicit resourcesJSON list
    if (resourcesJSON) {
      var list = null;
      try {
        list = typeof resourcesJSON === 'string' ? JSON.parse(resourcesJSON) : resourcesJSON;
      } catch (e) {
        logging.error("psychojs: resourcesJSON parse failed: " + (e && e.message));
      }
      if (Array.isArray(list)) {
        for (var k = 0; k < list.length; k++) {
          var item = list[k];
          if (!item || typeof item !== 'object') continue;
          copyPair(item.abs || item.path || item.src, item.rel || item.name || path.basename(item.abs || ''));
        }
      }
    }

    // 2. Fallback: scan expDir for any resource-type files not already copied.
    if (expDir && fs.existsSync(expDir) && fs.statSync(expDir).isDirectory()) {
      try {
        var entries = fs.readdirSync(expDir);
        for (var j = 0; j < entries.length; j++) {
          var name = entries[j];
          var srcPath = path.join(expDir, name);
          try {
            if (!fs.statSync(srcPath).isFile()) continue;
          } catch (_) { continue; }
          var ext = path.extname(name).toLowerCase();
          if (!_RESOURCE_EXTS_SET[ext]) continue;
          // Skip already-copied files (keyed by basename in fallback mode).
          if (copied[name]) continue;
          try {
            fs.copyFileSync(srcPath, path.join(outDir, name));
            copied[name] = true;
            logging.log("psychojs: copied resource " + name + " from expDir");
          } catch (e) {
            logging.error("psychojs: failed to copy " + name + ": " + (e && e.message));
          }
        }
      } catch (e) {
        logging.error("psychojs: expDir scan failed: " + (e && e.message));
      }
    }

    logging.log("psychojs: resource copy complete — " + Object.keys(copied).length + " files");
  }

  // CSS for PsychoJS GUI dialogs. PsychoJS's own dialog stylesheet is not
  // shipped with the IIFE/ESM bundle, so without these rules DlgFromDict
  // creates DOM elements that have zero size, no positioning, and default
  // (transparent) backgrounds — the participant dialog is therefore
  // invisible even though the markup is present in #root. The rules below
  // mirror the .dialog-container / .dialog-content / .dialog-overlay /
  // .dialog-title / .dialog-button / .progress-* / .scrollable-container
  // classes referenced inside _GUI.DlgFromDict and _GUI.dialog in the
  // psychojs-2026.1.2 ESM library. z-index:10000 places the dialog above
  // the pixi canvas (which sits inside #root at the default z-index).
  function _psychojsDialogCSS() {
    return [
      // A11yDialog.hide() only sets aria-hidden="true" on the dialog element
      // without removing it from the DOM. Without this CSS rule the dialog
      // stays visible after hide(), causing users to click Cancel/Close
      // buttons which triggers _onCancelExperiment → this._dialog.hide()
      // where _dialog is already null (set by _onStartExperiment), producing
      // TypeError: Cannot read properties of null (reading 'hide').
      '.dialog-container[aria-hidden="true"]{display:none!important}',
      '.dialog-container{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);font-family:Arial,Helvetica,sans-serif;color:#222}',
      '.dialog-container .dialog-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:transparent}',
      '.dialog-container .dialog-content{position:relative;z-index:1;max-width:480px;width:90vw;max-height:90vh;overflow:hidden;background:#fff;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.45);display:flex;flex-direction:column}',
      '.dialog-container .dialog-title{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#f6f7f9;border-bottom:1px solid #e5e5e5;border-radius:8px 8px 0 0}',
      '.dialog-container .dialog-title p{margin:0;font-size:16px;font-weight:600;color:#333}',
      '.dialog-container .dialog-close{background:transparent;border:0;font-size:22px;line-height:1;color:#999;cursor:pointer;padding:0 4px}',
      '.dialog-container .dialog-close:hover{color:#333}',
      '.dialog-container .scrollable-container{padding:16px 18px;overflow:auto;flex:1 1 auto;font-size:14px;line-height:1.45}',
      '.dialog-container .scrollable-container label{display:block;margin:10px 0 4px;font-weight:600;color:#444}',
      '.dialog-container .scrollable-container .text,.dialog-container .scrollable-container select{width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box}',
      '.dialog-container .scrollable-container .checkbox{width:auto}',
      '.dialog-container .scrollable-container .validateTips{margin:10px 0 0;font-size:12px;color:#888}',
      '.dialog-container .scrollable-container hr{border:0;border-top:1px solid #eee;margin:14px 0}',
      '.dialog-container .logo{max-width:200px;max-height:80px;display:block;margin:0 auto 12px}',
      '.dialog-container .progress-msg{padding:6px 18px 0;font-size:12px;color:#666}',
      '.dialog-container .progress-container{height:8px;background:#eee;margin:6px 18px 14px;border-radius:4px;overflow:hidden}',
      '.dialog-container .progress-bar{height:100%;width:0%;background:#3071e0;transition:width .2s linear}',
      '.dialog-container .dialog-button-group{display:flex;justify-content:flex-end;gap:8px;padding:10px 18px;border-top:1px solid #eee;background:#fafafa}',
      '.dialog-container .dialog-button{padding:8px 16px;border:1px solid #ccc;border-radius:4px;background:#fff;color:#333;font-size:14px;cursor:pointer}',
      '.dialog-container .dialog-button:hover{background:#f0f0f0}',
      '.dialog-container .dialog-button.disabled{opacity:.5;cursor:not-allowed}',
      '.dialog-container .dialog-title.dialog-error{background:#fdecea}',
      '.dialog-container .dialog-title.dialog-error p{color:#b00020}',
      '.dialog-container .dialog-title.dialog-warning{background:#fff8e1}',
      '.dialog-container .dialog-title.dialog-warning p{color:#a86a00}',
      '.sn-notifications-container{position:fixed;bottom:20px;right:20px;z-index:10001;display:flex;flex-direction:column;gap:10px}',
    ].join('\n');
  }

  function _psychojsGenerateHTML(expName) {
    var n = (expName || "PsychoPy").replace(/[<>]/g, "");
    return [
      '<!DOCTYPE html><html><head><meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">',
      '<title>' + n + ' [PsychoPy]</title>',
      '<link rel="stylesheet" href="jquery-ui-1.12.1.min.css">',
      '<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;overflow:hidden;width:100vw;height:100vh}canvas{display:block}#root{position:absolute;top:0;left:0;width:100%;height:100%}#__error{position:fixed;top:0;left:0;width:100%;max-height:50vh;overflow:auto;background:rgba(0,0,0,0.9);color:#f44;padding:10px;font-family:monospace;font-size:12px;z-index:99999;display:none;white-space:pre-wrap}</style>',
      '<style>' + _psychojsDialogCSS() + '</style>',
      '</head><body><div id="root"></div><div id="__error"></div>',
      '<script>window.addEventListener("error",function(e){var ov=document.getElementById("__error");if(ov){ov.style.display="block";ov.textContent+="ERROR: "+e.message+"\\n"+(e.error&&e.error.stack||"")+"\\n";}});</script>',
      // Defence-in-depth: block all click events on elements inside
      // [aria-hidden="true"] dialogs. A11yDialog.hide() only sets
      // aria-hidden but leaves the DOM in place. The CSS display:none rule
      // hides the dialog visually, but stray click events can still fire on
      // the hidden buttons (e.g. if focus + Enter is used). This interceptor
      // prevents those clicks from reaching _onCancelExperiment which would
      // throw TypeError: Cannot read properties of null (reading 'hide')
      // because _dialog was already set to null by _onStartExperiment.
      '<script>',
      'document.addEventListener("click",function(e){var d=e.target.closest&&e.target.closest(".dialog-container[aria-hidden=\\"true\\"]");if(d){e.preventDefault();e.stopPropagation();}},true);',
      '</script>',
      '<script src="jquery-3.6.0.min.js"></script>',
      '<script src="jquery-ui-1.12.1.min.js"></script>',
      '<script src="preloadjs-1.0.0.min.js"></script>',
      '<script src="pixi-legacy-5.3.12.min.js"></script>',
      // No IIFE/bridge: experiment.js is ESM and imports everything it needs
      // from ./lib/psychojs-2026.1.2.js. Loading the IIFE in parallel creates
      // a second PsychoJS instance whose gui/window singletons diverge from
      // the ESM ones, which silently breaks DlgFromDict (the participant
      // dialog never attaches to the DOM).
      '<script type="module" src="experiment.js"></script>',
      '</body></html>',
    ].join('\n');
  }

  async function _psychojsStartServer(jsCode, expName, conditionsJSON, resourcesJSON, expDir) {
    var t;
    try { t = app.getPath("temp"); } catch(e) { t = os.tmpdir(); }
    var sn = (expName || "exp").replace(/[^a-zA-Z0-9_-]/g, "_");
    var d = path.join(t, "psychojs_" + sn + "_" + Date.now());
    fs.mkdirSync(d, { recursive: true });

    // Copy library files — including the official ESM library from Pavlovia CDN
    try {
      fs.writeFileSync(path.join(d, "jquery-3.6.0.min.js"), _psychojsReadLib("jquery-3.6.0.min.js"), "utf8");
      fs.writeFileSync(path.join(d, "jquery-ui-1.12.1.min.js"), _psychojsReadLib("jquery-ui-1.12.1.min.js"), "utf8");
      fs.writeFileSync(path.join(d, "jquery-ui-1.12.1.min.css"), _psychojsReadLib("jquery-ui-1.12.1.min.css"), "utf8");
      fs.writeFileSync(path.join(d, "pixi-legacy-5.3.12.min.js"), _psychojsReadLib("pixi-legacy-5.3.12.min.js"), "utf8");
      fs.writeFileSync(path.join(d, "preloadjs-1.0.0.min.js"), _psychojsReadLib("preloadjs-1.0.0.min.js"), "utf8");
      fs.writeFileSync(path.join(d, "psychojs-2026.1.2.iife.js"), _psychojsReadLib("psychojs-2026.1.2.iife.js"), "utf8");
      // Official ESM library — experiment imports from ./lib/psychojs-2026.1.2.js
      var libDir = path.join(d, "lib");
      fs.mkdirSync(libDir, { recursive: true });
      fs.writeFileSync(path.join(libDir, "psychojs-2026.1.2.js"), _psychojsReadLib("psychojs-2026.1.2.js"), "utf8");
    } catch(e) {
      logging.error("psychojs: failed to copy lib files:", e.message);
    }
    fs.writeFileSync(path.join(d, "experiment.js"), _fixGeneratedJS(jsCode || ""), "utf8");
    fs.writeFileSync(path.join(d, "index.html"), _psychojsGenerateHTML(expName || "experiment"), "utf8");
    if (conditionsJSON) {
      try { fs.writeFileSync(path.join(d, "conditions.json"), conditionsJSON, "utf8"); } catch(e){}
    }

    // Copy experiment resource files (xlsx/csv/images/audio/json) into the
    // HTTP output directory so PsychoJS ServerManager can download them.
    // Priority: explicit resourcesJSON list [{rel, abs}, ...], then a
    // fallback scan of expDir for any resource-type files.
    _copyExperimentResources(d, resourcesJSON, expDir);

    // Start HTTP server on first available port
    var mime = { '.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json' };
    var svr;
    var port = 9200;
    while (port < 9300) {
      try {
        svr = await new Promise(function(resolve, reject) {
          var s = http.createServer(function(req, res) {
            var reqPath = (req.url || "/").split('?')[0];
            // Map root "/" to index.html
            if (reqPath === "/") reqPath = "/index.html";
            var f = path.join(d, reqPath);
            // Security: ensure path stays inside d
            if (f.indexOf(d) !== 0) {
              res.writeHead(403);
              res.end();
              return;
            }
            if (fs.existsSync(f) && fs.statSync(f).isFile()) {
              var ext = path.extname(f);
              res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
              res.end(fs.readFileSync(f));
            } else {
              res.writeHead(404);
              res.end();
            }
          });
          s.once("error", function(e) {
            s.close();
            reject(e);
          });
          s.listen(port, "0.0.0.0", function() { resolve(s); });
        });
        break;
      } catch (e) {
        port++;
      }
    }
    if (!svr) throw new Error("No available port for PsychoJS server");
    // HarmonyOS system browser cannot access 127.0.0.1 (sandbox isolation).
    // Use the device's actual network IP so the browser can reach the server.
    var deviceIP = "127.0.0.1";
    try {
      var ifaces = os.networkInterfaces();
      for (var name in ifaces) {
        for (var i = 0; i < ifaces[name].length; i++) {
          var addr = ifaces[name][i];
          if (addr.family === 'IPv4' && !addr.internal) {
            deviceIP = addr.address;
            break;
          }
        }
        if (deviceIP !== "127.0.0.1") break;
      }
    } catch(e) {}
    var url = "http://" + deviceIP + ":" + port + "/";
    _psychojsServers[url] = { server: svr, dir: d };
    logging.log("PsychoJS server started at " + url);
    return url;
  }

  // ── PsychoJS IPC handlers ────────────────────────────────────
  ipcMain.handle("python.psychojs.run", async (evt, cwd) => {
    logging.error("python.psychojs.run is deprecated — use browserRun");
    return { error: "deprecated" };
  });

  ipcMain.handle("python.psychojs.stop", (evt, address) => {
    var s = _psychojsServers[address || ""];
    if (s) { try { s.server.close(); } catch(_){} try { fs.rmSync(s.dir,{recursive:true,force:true}); } catch(_){} delete _psychojsServers[address]; return true; }
    return false;
  });

  ipcMain.handle("python.psychojs.browserRun", async (evt, jsCode, expName, conditionsJSON, resourcesJSON, expDir) => {
    try {
      var url = await _psychojsStartServer(jsCode, expName, conditionsJSON, resourcesJSON, expDir);
      // Open in system browser — try multiple approaches
      var opened = false;

      // 1) Try Electron shell.openExternal
      try {
        const { shell: esh } = require_("electron");
        var shellResult = esh.openExternal(url);
        if (shellResult) {
          opened = true;
          logging.log("browserRun: opened via shell.openExternal");
        } else {
          logging.log("browserRun: shell.openExternal returned falsy, falling through");
        }
      } catch (e) {
        logging.log("browserRun: shell.openExternal failed: " + (e && e.message));
      }

      // 2) Try NAPI bindings (may not be ready yet)
      if (!opened) {
        try {
          if (typeof globalThis.ExternalProtocolAdapter !== 'undefined' && globalThis.ExternalProtocolAdapter.OpenExternal) {
            globalThis.ExternalProtocolAdapter.OpenExternal(url);
            opened = true;
            logging.log("browserRun: opened via ExternalProtocolAdapter");
          } else if (typeof globalThis.FileManagerAdapter !== 'undefined' && globalThis.FileManagerAdapter.OpenUrlInDefaultBrowser) {
            globalThis.FileManagerAdapter.OpenUrlInDefaultBrowser(url);
            opened = true;
            logging.log("browserRun: opened via FileManagerAdapter");
          }
        } catch (e) {
          logging.log("browserRun: NAPI failed: " + (e && e.message));
        }
      }

      // 3) Fallback: aa start system command
      if (!opened) {
        try {
          proc.execSync('aa start -a MainAbility -b com.huawei.hwbrowser --ps uri "' + url + '"', { timeout: 5000 });
          opened = true;
          logging.log("browserRun: opened via aa start");
        } catch (e) {
          logging.log("browserRun: aa start failed: " + (e && e.message));
        }
      }

      if (!opened) {
        logging.error("browserRun: ALL open methods failed");
      }
      return { url: url };
    } catch (err) {
      logging.error('browserRun failed: ' + (err && (err.stack || err.message || String(err))));
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

  ipcMain.handle("python.psychojs.browserStop", (evt, address) => {
    var s = _psychojsServers[address || ""];
    if (s) { try { s.server.close(); } catch(_){} try { fs.rmSync(s.dir,{recursive:true,force:true}); } catch(_){} delete _psychojsServers[address]; return true; }
    return false;
  });

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
