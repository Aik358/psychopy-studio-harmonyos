/**
 * ws_polyfill.js — WebSocket client for the Electron-OH MAIN process.
 *
 * Problem C: python/liaison.js calls `new WebSocket(url)`. Standard Electron
 * main process does NOT expose a global WebSocket (Node <22 has none; Electron-OH
 * may strip it). There is no `ws` npm package bundled in this runtime, so we
 * provide a tiny RFC6455 client built on node's `net` + `crypto` — no deps.
 *
 * Usage: `new (getWebSocket())(url)` — returns the native global if present,
 * otherwise the net-based fallback below.
 */
import net from "net";
import crypto from "crypto";

class NetWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.binaryType = "nodebuffer";
    this._listeners = { open: [], message: [], error: [], close: [] };
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this._buffer = Buffer.alloc(0);
    this._handshakeDone = false;
    this._fragments = [];
    this._fragOpcode = null;
    this._connect();
  }

  _emit(type, evt) {
    (this._listeners[type] || []).forEach((fn) => {
      try { fn(evt); } catch (_) {}
    });
    const handler = this["on" + type];
    if (typeof handler === "function") {
      try { handler(evt); } catch (_) {}
    }
  }

  addEventListener(type, fn) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(fn);
  }

  removeEventListener(type, fn) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter((f) => f !== fn);
  }

  _connect() {
    let u;
    try { u = new URL(this.url); } catch (e) {
      this.readyState = 3;
      this._emit("error", { message: "bad url: " + e.message });
      return;
    }
    const port = u.port ? parseInt(u.port, 10) : (u.protocol === "wss:" ? 443 : 80);
    const path = (u.pathname || "/") + (u.search || "");
    const key = crypto.randomBytes(16).toString("base64");
    const reqLines = [
      `GET ${path} HTTP/1.1`,
      `Host: ${u.hostname}:${port}`,
      `Upgrade: websocket`,
      `Connection: Upgrade`,
      `Sec-WebSocket-Key: ${key}`,
      `Sec-WebSocket-Version: 13`,
      `Origin: http://${u.hostname}`,
      `\r\n`,
    ];
    const socket = net.connect(port, u.hostname, () => {
      socket.write(reqLines.join("\r\n"));
    });
    this._socket = socket;
    socket.on("data", (chunk) => this._onData(chunk));
    socket.on("error", (err) => {
      this.readyState = 3;
      this._emit("error", { message: err.message });
    });
    socket.on("close", () => {
      this.readyState = 3;
      this._emit("close", { code: 1006, reason: "transport closed" });
    });
  }

  _onData(chunk) {
    this._buffer = Buffer.concat([this._buffer, chunk]);
    if (!this._handshakeDone) {
      const idx = this._buffer.indexOf("\r\n\r\n");
      if (idx === -1) return; // wait for full handshake
      const header = this._buffer.slice(0, idx).toString();
      if (!/HTTP\/1\.1 101/.test(header)) {
        this.readyState = 3;
        this._emit("error", { message: "handshake failed: " + header.split("\r\n")[0] });
        return;
      }
      this._buffer = this._buffer.slice(idx + 4);
      this._handshakeDone = true;
      this.readyState = 1; // OPEN
      this._emit("open", {});
    }
    // Parse as many complete frames as we have
    while (this._handshakeDone) {
      const frame = this._parseFrame();
      if (!frame) break;
      this._handleFrame(frame);
    }
  }

  _parseFrame() {
    if (this._buffer.length < 2) return null;
    const b0 = this._buffer[0];
    const b1 = this._buffer[1];
    const fin = (b0 & 0x80) === 0x80;
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) === 0x80;
    let len = b1 & 0x7f;
    let offset = 2;
    if (len === 126) {
      if (this._buffer.length < 4) return null;
      len = this._buffer.readUInt16BE(2);
      offset = 4;
    } else if (len === 127) {
      if (this._buffer.length < 10) return null;
      len = Number(this._buffer.readBigUInt64BE(2));
      offset = 10;
    }
    let maskKey = null;
    if (masked) {
      if (this._buffer.length < offset + 4) return null;
      maskKey = this._buffer.slice(offset, offset + 4);
      offset += 4;
    }
    if (this._buffer.length < offset + len) return null; // wait for full payload
    let payload = this._buffer.slice(offset, offset + len);
    if (maskKey) {
      const unmasked = Buffer.alloc(len);
      for (let i = 0; i < len; i++) unmasked[i] = payload[i] ^ maskKey[i % 4];
      payload = unmasked;
    }
    this._buffer = this._buffer.slice(offset + len);
    return { fin, opcode, data: payload };
  }

  _handleFrame(frame) {
    const { fin, opcode, data } = frame;
    if (opcode === 0x8) { // close
      this.close();
      return;
    }
    if (opcode === 0x9) { // ping -> pong
      this._sendFrame(0xA, data);
      return;
    }
    if (opcode === 0xA) { // pong
      return;
    }
    if (opcode === 0x0) { // continuation
      this._fragments.push(data);
      if (fin) {
        const full = Buffer.concat(this._fragments);
        const op = this._fragOpcode;
        this._fragments = [];
        this._fragOpcode = null;
        this._emit("message", { data: full });
      }
      return;
    }
    // 0x1 text / 0x2 binary
    if (!fin) {
      this._fragOpcode = opcode;
      this._fragments = [data];
      return;
    }
    this._emit("message", { data });
  }

  _sendFrame(opcode, payload) {
    if (!this._socket || this.readyState !== 1) return;
    const len = payload.length;
    const header = Buffer.alloc(2);
    header[0] = 0x80 | opcode; // FIN + opcode
    let lenBuf;
    if (len < 126) {
      header[1] = len;
      lenBuf = Buffer.alloc(0);
    } else if (len < 65536) {
      header[1] = 126;
      lenBuf = Buffer.alloc(2);
      lenBuf.writeUInt16BE(len, 0);
    } else {
      header[1] = 127;
      lenBuf = Buffer.alloc(8);
      lenBuf.writeBigUInt64BE(BigInt(len), 0);
    }
    // client MUST mask its frames
    const mask = crypto.randomBytes(4);
    const masked = Buffer.alloc(len);
    for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i % 4];
    this._socket.write(Buffer.concat([header, lenBuf, mask, masked]));
  }

  send(data) {
    if (typeof data !== "string") data = String(data);
    this._sendFrame(0x1, Buffer.from(data, "utf8"));
  }

  close() {
    if (this.readyState === 3) return;
    try { this._sendFrame(0x8, Buffer.alloc(0)); } catch (_) {}
    this.readyState = 3;
    try { this._socket && this._socket.end(); } catch (_) {}
    this._emit("close", { code: 1000, reason: "client closed" });
  }
}

let _cachedWS = undefined;
/**
 * Resolve a WebSocket constructor for the main process.
 * Prefers the native global (Electron 31+/Node 22+); falls back to NetWebSocket.
 */
export function getWebSocket() {
  if (_cachedWS !== undefined) return _cachedWS;
  try {
    if (typeof globalThis.WebSocket !== "undefined" && typeof globalThis.WebSocket === "function") {
      _cachedWS = globalThis.WebSocket;
      return _cachedWS;
    }
  } catch (_) {}
  _cachedWS = NetWebSocket;
  return _cachedWS;
}

export default getWebSocket;
