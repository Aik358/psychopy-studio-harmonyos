import proc from "child_process";
import net from "net";
import logging from "../logging.js";
import { BrowserWindow } from "electron";

export const decoder = new TextDecoder();

// ── tcp-port-used 可选加载 ──────────────────────────────
// Electron-OH (鸿蒙) 的 node_modules 可能没有 tcp-port-used 包。
// 顶层静态 import 会导致整个模块加载失败，所有 Python IPC handler 都不会注册。
// 改为懒加载：优先用 tcp-port-used，不可用时 fallback 到纯 net 实现。
let _tcpPortUsed = null;
async function _getTcpPortUsed() {
    if (_tcpPortUsed !== null) return _tcpPortUsed;
    try {
        const mod = await import("tcp-port-used");
        _tcpPortUsed = mod.default || mod;
        logging.log("[utils] tcp-port-used loaded");
    } catch (_) {
        _tcpPortUsed = false;
        logging.log("[utils] tcp-port-used not available, using net fallback");
    }
    return _tcpPortUsed;
}

/**
 * Check if a TCP port is in use on localhost (pure Node.js net, no deps).
 */
function _checkPortNative(port, host) {
    return new Promise((resolve) => {
        const tester = net.createConnection({ port, host });
        tester.once("connect", () => {
            tester.end();
            resolve(true);  // port is in use
        });
        tester.once("error", (err) => {
            resolve(err.code === "EADDRINUSE" || false);
        });
        // If neither fires within 500ms, assume port is free
        setTimeout(() => {
            tester.destroy();
            resolve(false);
        }, 500);
    });
}

/**
 * Check if a TCP port is in use. Uses tcp-port-used if available, else net fallback.
 */
async function _checkPort(port, host) {
    const tcp = await _getTcpPortUsed();
    if (tcp && typeof tcp.check === "function") {
        return tcp.check(port, host);
    }
    return _checkPortNative(port, host);
}

/**
 * Get an unused localhost address which is safe to start Liaison at
 */
export async function getSafeAddress() {
    // start with 8002
    let port = 8002
    // check initially
    let inUse = await _checkPort(port, "localhost")
    // if in use, iterate and try again
    while (inUse) {
        port += 1
        inUse = await _checkPort(port, "localhost")
    }

    return `localhost:${port}`
}


/**
 * Send some output to the front end
 * 
 * @param {string} tag Channel to send over (use undefined to not emit an event), you can specify subchannels using ":" (e.g. `uv:psychopy-cedrus` will go to both `uv` and `uv:psychopy-cedrus`)
 * @param {string|Buffer} message Message to send, can be either bytes or a string
 */
export function output(tag, message) {
    // get all channels to send output to (using : syntax)
    let channels = []
    if (tag) {
        // add initial tag
        channels.push(tag)
        // add each parent in tree
        while (tag?.includes?.(":")) {
            tag = tag.substring(0, tag.lastIndexOf(":"))
            channels.push(tag)
        }
    }
    // if given a buffer, decode it
    if (message instanceof Buffer) {
        message = decoder.decode(message)
    }
    // log message
    logging.log(message, tag?.toUpperCase?.())
    // emit event
    for (let channel of channels) {
        BrowserWindow.getAllWindows().forEach(
            win => win.webContents.send(channel, message)
        )
    }
}


/**
 * Log some input to the front end (works the same as logging output, only formatted differently). 
 * 
 * NOTE: this doesn't call the command, just tells the front end what was called.
 * 
 * @param {string} tag Channel to send over (use undefined to not emit an event)
 * @param {string|Buffer} message Message to send, can be either bytes or a string
 */
export function input(tag, message, timeout=undefined) {
    // if given a buffer, decode it
    if (message instanceof Buffer) {
        message = decoder.decode(message)
    }
    // prepend >>
    message = `>> ${message}`
    // append timeout
    if (timeout) {
        message = `${message} (timeout = ${timeout}ms)`
    }
    // send as output with prepended >>
    output(tag, message)
}


/**
 * Execute a function synchronously with output sent to the front end
 * 
 * @param {string} tag Channel to send any output over
 * @param {string} command Command to run
 * @param {array<string>} args Arguments to pass to child process
 * @param {int} timeout Time (ms) after which to give up
 */
export function execSync(tag, command, args, timeout=undefined) {
    // join args 
    let cmd = [command, ...args].join(" ")
    // log input in front end
    input(tag, cmd, timeout)
    // execute
    let resp = proc.execSync(cmd, {timeout: timeout})
    // decode resp if necessary
    if (resp instanceof Buffer) {
        resp = decoder.decode(resp)
    }
    // strip resp if necessary
    if (typeof resp === "string") {
        resp = resp.trim()
    }
    // pass output to front end
    output(tag, resp)

    return resp
}

/**
 * Execute a function with output sent to the front end
 * 
 * @param {string} tag Channel to send any output over
 * @param {string} command Command to run
 * @param {array<string>} args Arguments to pass to child process
 * @param {int} timeout Time (ms) after which to give up, leave undefined to not timeout
 */
export async function execTracked(tag, command, args, timeout=undefined) {
    // log input in front end
    input(tag, `${command} ${(args || []).join(" ")}`, timeout)
    // execute asynchronously
    let process = proc.spawn(command, args, {timeout: timeout})
    // pass output to front end
    process.stdout.on("data", evt => output(tag, evt))
    process.stderr.on("data", evt => output(tag, evt))
    // await completion/error
    let promise = Promise.withResolvers()
    process.on("close", (code, signal) => promise.resolve([code, signal]))
    process.on("error", err => promise.reject(err))

    return promise.promise
}