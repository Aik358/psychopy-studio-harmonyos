/*
 * psychojs-browser/index.cjs v20 — IIFE Legacy Mode
 *
 * Root cause of black screen (v1-v19):
 *   - Official HTML uses <script type="module"> for modern browsers, which needs
 *     psychojs-{version}.js (ESM format) that we don't have.
 *   - <script nomodule> + IIFE only runs in old browsers.
 *   - We loaded IIFE with plain <script> but never set up global variables
 *     (util, Scheduler, PsychoJS constructor) that legacy-browsers.js expects.
 *
 * v20 fix:
 *   - Load IIFE with plain <script> (works in all browsers)
 *   - Add bridge script that extracts globals from window.PsychoJS namespace
 *   - Generate legacy-browsers style experiment.js (no import statements)
 *   - experiment.js uses globals: PsychoJS, util, Scheduler, visual, core, data
 */
const path = require("path");
const fs = require("fs");
const os = require("os");
const { randomUUID } = require("node:crypto");
const { app, shell } = require("electron");
const servers = {};

function getTempDir() {
  var b;
  try { b = app.getPath("temp"); } catch(e) { b = os.tmpdir(); }
  var d = path.join(b, "psychopy-oh-psychojs");
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

function readLib(n) {
  return fs.readFileSync(path.join(__dirname, "lib", n), "utf8");
}

// Bridge script: sets up global variables from IIFE namespace
// This replaces the import statements that modular code would use
function generateBridgeScript() {
  return [
    '(function(){',
    '  var ns = window.PsychoJS;',
    '  if (!ns || typeof ns !== "object") {',
    '    document.body.innerHTML = "<pre style=\\"color:red;padding:20px\\">FATAL: PsychoJS IIFE not loaded. window.PsychoJS is: " + ns + "</pre>";',
    '    return;',
    '  }',
    '',
    '  // Extract the real PsychoJS constructor from ns.core.PsychoJS',
    '  var RealPsychoJS = ns.core && ns.core.PsychoJS;',
    '  if (typeof RealPsychoJS !== "function") {',
    '    document.body.innerHTML = "<pre style=\\"color:red;padding:20px\\">FATAL: PsychoJS constructor not found in ns.core</pre>";',
    '    return;',
    '  }',
    '',
    '  // Set global variables that legacy-browsers.js expects:',
    '  window.PsychoJS = RealPsychoJS;  // Replace namespace with constructor',
    '  window.util = ns.util;',
    '  window.visual = ns.visual;',
    '  window.core = ns.core;',
    '  window.data = ns.data;',
    '  window.sound = ns.sound;',
    '  window.hardware = ns.hardware;',
    '',
    '  // Common aliases used in generated code',
    '  window.Scheduler = ns.util.Scheduler;',
    '  window.TrialHandler = ns.data.TrialHandler;',
    '  window.MultiStairHandler = ns.data.MultiStairHandler;',
    '',
    '  // Copy static properties (PsychoJS.Status, etc.)',
    '  for (var k in RealPsychoJS) {',
    '    if (RealPsychoJS.hasOwnProperty(k)) window.PsychoJS[k] = RealPsychoJS[k];',
    '  }',
    '  if (RealPsychoJS.prototype) window.PsychoJS.prototype = RealPsychoJS.prototype;',
    '',
    '  console.log("[Bridge] Globals installed:", {',
    '    PsychoJS: typeof window.PsychoJS,',
    '    util: typeof window.util,',
    '    Scheduler: typeof window.Scheduler,',
    '    visual: typeof window.visual,',
    '    core: typeof window.core',
    '  });',
    '})();',
  ].join('\n');
}

function generateHTML(expName) {
  var n = (expName || "PsychoPy").replace(/[<>]/g, "");

  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">',
    '<title>' + n + ' [PsychoPy]</title>',
    '<!-- styles -->',
    '<link rel="stylesheet" href="jquery-ui-1.12.1.min.css">',
    '<style>',
    '  *{margin:0;padding:0;box-sizing:border-box}',
    '  body{background:#000;overflow:hidden;width:100vw;height:100vh}',
    '  canvas{display:block}',
    '  #root{position:absolute;top:0;left:0;width:100%;height:100%}',
    '  #__error_overlay{position:fixed;top:0;left:0;width:100%;max-height:50vh;overflow:auto;background:rgba(0,0,0,0.9);color:#f44;padding:10px;font-family:monospace;font-size:12px;z-index:99999;display:none;white-space:pre-wrap}',
    '</style>',
    '</head>',
    '<body>',
    '<div id="root"></div>',
    '<div id="__error_overlay"></div>',
    '<script>',
    'window.addEventListener("error", function(e) {',
    '  var ov = document.getElementById("__error_overlay");',
    '  if (ov) { ov.style.display = "block"; ov.textContent += "ERROR: " + e.message + " (" + e.filename + ":" + e.lineno + ")\\n" + (e.error && e.error.stack || "") + "\\n"; }',
    '});',
    'window.addEventListener("unhandledrejection", function(e) {',
    '  var ov = document.getElementById("__error_overlay");',
    '  if (ov) { ov.style.display = "block"; ov.textContent += "PROMISE REJECT: " + (e.reason && e.reason.message || e.reason) + "\\n" + (e.reason && e.reason.stack || "") + "\\n"; }',
    '});',
    '</script>',
    '<!-- external libraries (required by PsychoJS) -->',
    '<script src="jquery-3.6.0.min.js"></script>',
    '<script src="jquery-ui-1.12.1.min.js"></script>',
    '<script src="preloadjs-1.0.0.min.js"></script>',
    '<!-- PIXI.js (required by PsychoJS visual) -->',
    '<script src="pixi-legacy-5.3.12.min.js"></script>',
    '<!-- PsychoJS IIFE library -->',
    '<script src="psychojs-2025.2.4.iife.js"></script>',
    '<!-- Bridge: extract globals from IIFE namespace -->',
    '<script>',
    generateBridgeScript(),
    '</script>',
    '<!-- Experiment code (legacy-browsers style, no imports) -->',
    '<script src="experiment.js"></script>',
    '</body>',
    '</html>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// ESM fallback (no-Python path)
// When the experiment code is an ES module (has `import`/`export`), serve it
// with <script type="module"> + the psychojs-2026.1.2 ESM library — mirroring
// python/psychopy_worker.py exactly, so the no-Python runtime produces the
// SAME directory the Python worker does. When it is NOT a module we keep the
// legacy IIFE + bridge path below.
// ---------------------------------------------------------------------------
var ESM_LIB_VERSION = "2026.1.2";
var ESM_ROOT_LIBS = [
  "jquery-3.6.0.min.js",
  "jquery-ui-1.12.1.min.js",
  "jquery-ui-1.12.1.min.css",
  "pixi-legacy-5.3.12.min.js",
  "preloadjs-1.0.0.min.js",
  "psychojs-2026.1.2.iife.js"
];

var ESM_DIALOG_CSS = `.dialog-container[aria-hidden="true"]{display:none!important}
.dialog-container{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);font-family:Arial,Helvetica,sans-serif;color:#222}
.dialog-container .dialog-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:transparent}
.dialog-container .dialog-content{position:relative;z-index:1;max-width:480px;width:90vw;max-height:90vh;overflow:hidden;background:#fff;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.45);display:flex;flex-direction:column}
.dialog-container .dialog-title{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#f6f7f9;border-bottom:1px solid #e5e5e5;border-radius:8px 8px 0 0}
.dialog-container .dialog-title p{margin:0;font-size:16px;font-weight:600;color:#333}
.dialog-container .dialog-close{background:transparent;border:0;font-size:22px;line-height:1;color:#999;cursor:pointer;padding:0 4px}
.dialog-container .dialog-close:hover{color:#333}
.dialog-container .scrollable-container{padding:16px 18px;overflow:auto;flex:1 1 auto;font-size:14px;line-height:1.45}
.dialog-container .scrollable-container label{display:block;margin:10px 0 4px;font-weight:600;color:#444}
.dialog-container .scrollable-container .text,.dialog-container .scrollable-container select{width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box}
.dialog-container .scrollable-container .checkbox{width:auto}
.dialog-container .scrollable-container .validateTips{margin:10px 0 0;font-size:12px;color:#888}
.dialog-container .scrollable-container hr{border:0;border-top:1px solid #eee;margin:14px 0}
.dialog-container .logo{max-width:200px;max-height:80px;display:block;margin:0 auto 12px}
.dialog-container .progress-msg{padding:6px 18px 0;font-size:12px;color:#666}
.dialog-container .progress-container{height:8px;background:#eee;margin:6px 18px 14px;border-radius:4px;overflow:hidden}
.dialog-container .progress-bar{height:100%;width:0%;background:#3071e0;transition:width .2s linear}
.dialog-container .dialog-button-group{display:flex;justify-content:flex-end;gap:8px;padding:10px 18px;border-top:1px solid #eee;background:#fafafa}
.dialog-container .dialog-button{padding:8px 16px;border:1px solid #ccc;border-radius:4px;background:#fff;color:#333;font-size:14px;cursor:pointer}
.dialog-container .dialog-button:hover{background:#f0f0f0}
.dialog-container .dialog-button.disabled{opacity:.5;cursor:not-allowed}
.dialog-container .dialog-title.dialog-error{background:#fdecea}
.dialog-container .dialog-title.dialog-error p{color:#b00020}
.dialog-container .dialog-title.dialog-warning{background:#fff8e1}
.dialog-container .dialog-title.dialog-warning p{color:#a86a00}
.sn-notifications-container{position:fixed;bottom:20px;right:20px;z-index:10001;display:flex;flex-direction:column;gap:10px}`;

var ESM_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>__EXP_TITLE__ [PsychoPy]</title>
<link rel="stylesheet" href="jquery-ui-1.12.1.min.css">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;overflow:hidden;width:100vw;height:100vh}canvas{display:block}#root{position:absolute;top:0;left:0;width:100%;height:100%}#__error{position:fixed;top:0;left:0;width:100%;max-height:50vh;overflow:auto;background:rgba(0,0,0,0.9);color:#f44;padding:10px;font-family:monospace;font-size:12px;z-index:99999;display:none;white-space:pre-wrap}</style>
<style>__DIALOG_CSS__</style>
</head><body><div id="root"></div><div id="__error"></div>
<script>window.addEventListener("error",function(e){var ov=document.getElementById("__error");if(ov){ov.style.display="block";ov.textContent+="ERROR: "+e.message+"\\n"+(e.error&&e.error.stack||"")+"\\n";}});</script>
<script>
document.addEventListener("click",function(e){var d=e.target.closest&&e.target.closest(".dialog-container[aria-hidden=\\"true\\"]");if(d){e.preventDefault();e.stopPropagation();}},true);
</script>
<script src="jquery-3.6.0.min.js"></script>
<script src="jquery-ui-1.12.1.min.js"></script>
<script src="preloadjs-1.0.0.min.js"></script>
<script src="pixi-legacy-5.3.12.min.js"></script>
<script type="module" src="experiment.js"></script>
</body></html>`;

function isESMCode(code) {
  return /\bimport\b|\bexport\b/.test(code) || /type=["']module["']/.test(code);
}

// Force experiment.js to import the locally-shipped ESM psychojs lib,
// matching python/psychopy_worker.py._normalize_esm_import.
function normalizeESMImport(code) {
  var v = ESM_LIB_VERSION;
  var hasPsychojs = /from\s+["'][^"']*psychojs[^"']*["']/.test(code);
  code = code.replace(/(from\s+["'])([^"']*psychojs[^"']*)(["'])/g, "$1./lib/psychojs-" + v + ".js$3");
  if (!hasPsychojs) {
    // CDN / other relative .js import without the word "psychojs"
    code = code.replace(/(from\s+["'])([^"']+\.js)(["'])/g, "$1./lib/psychojs-" + v + ".js$3");
  }
  return code;
}

function copyESMLibs(d) {
  var lib = path.join(__dirname, "lib");
  if (!fs.existsSync(lib)) return false;
  ESM_ROOT_LIBS.forEach(function (n) {
    var src = path.join(lib, n);
    if (fs.existsSync(src)) { try { fs.copyFileSync(src, path.join(d, n)); } catch (e) {} }
  });
  var esmSrc = path.join(lib, "psychojs-" + ESM_LIB_VERSION + ".js");
  if (fs.existsSync(esmSrc)) {
    var dest = path.join(d, "lib", "psychojs-" + ESM_LIB_VERSION + ".js");
    try { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(esmSrc, dest); } catch (e) {}
  }
  return true;
}

function generateESMHTML(expName) {
  var n = (expName || "PsychoPy").replace(/[<>]/g, "");
  return ESM_HTML.replace("__EXP_TITLE__", n).replace("__DIALOG_CSS__", ESM_DIALOG_CSS);
}

// Find a genuinely free TCP port at/after `base` by actually probing a bind.
// We can't just use `9200 + servers.length`: the module is re-required on
// every browserRun call (see index.cjs), which resets the module-level
// `servers` object, so a fixed base collides with still-bound old sockets and
// throws EADDRINUSE on the 2nd run. Probing a real bind avoids that entirely.
function getFreePort(base) {
  return new Promise(function (resolve, reject) {
    function tryPort(p) {
      if (p > base + 200) { reject(new Error("No free port for PsychoJS server")); return; }
      var probe = require('net').createServer();
      probe.once('error', function () { try { probe.close(); } catch (_) {} tryPort(p + 1); });
      probe.listen(p, "0.0.0.0", function () { try { probe.close(); } catch (_) {} resolve(p); });
    }
    tryPort(base);
  });
}

async function startServer(jsCode, expName, conditionsJSON, resourcesJSON, expDir) {
  var t = getTempDir();
  var id = randomUUID().slice(0, 8);
  var sn = (expName || "exp").replace(/[^a-zA-Z0-9_-]/g, "_");
  var d = path.join(t, sn + "_" + id);
  fs.mkdirSync(d, { recursive: true });

  var expCode = jsCode || "";
  console.log("[psychojs-browser] experiment.js (" + expCode.length + " bytes)" +
    " conditions=" + (conditionsJSON ? conditionsJSON.length : 0) +
    " resources=" + (resourcesJSON ? resourcesJSON.length : 0) +
    " expDir=" + expDir);

  // Decide ESM vs legacy based on the experiment code shape.
  var isESM = isESMCode(expCode);
  if (isESM) {
    // ESM path (no Python): mirror python/psychopy_worker.py output exactly.
    copyESMLibs(d);
    console.log("[psychojs-browser] ESM mode: writing module experiment.js + lib/psychojs-" + ESM_LIB_VERSION + ".js");
  } else {
    // Legacy IIFE path (non-module experiment.js) — keep original behaviour.
    fs.writeFileSync(path.join(d, "jquery-3.6.0.min.js"), readLib("jquery-3.6.0.min.js"), "utf8");
    fs.writeFileSync(path.join(d, "jquery-ui-1.12.1.min.js"), readLib("jquery-ui-1.12.1.min.js"), "utf8");
    fs.writeFileSync(path.join(d, "jquery-ui-1.12.1.min.css"), readLib("jquery-ui-1.12.1.min.css"), "utf8");
    fs.writeFileSync(path.join(d, "pixi-legacy-5.3.12.min.js"), readLib("pixi-legacy-5.3.12.min.js"), "utf8");
    fs.writeFileSync(path.join(d, "preloadjs-1.0.0.min.js"), readLib("preloadjs-1.0.0.min.js"), "utf8");
    fs.writeFileSync(path.join(d, "psychojs-2025.2.4.iife.js"), readLib("psychojs-2025.2.4.iife.js"), "utf8");
  }

  // Write experiment.js (normalize ESM import path if needed)
  fs.writeFileSync(path.join(d, "experiment.js"), isESM ? normalizeESMImport(expCode) : expCode, "utf8");

  // Write conditions.json if provided
  if (conditionsJSON) {
    try { fs.writeFileSync(path.join(d, "conditions.json"), conditionsJSON, "utf8"); } catch(e){}
  }

  // Copy resource files from expDir
  if (expDir && fs.existsSync(expDir)) {
    try {
      var resources = resourcesJSON ? JSON.parse(resourcesJSON) : null;
      if (Array.isArray(resources)) {
        resources.forEach(function(r) {
          var rel = (typeof r === "string") ? r : (r && (r.rel || r.path || r.name));
          if (!rel) return;
          var src = path.join(expDir, rel);
          if (fs.existsSync(src) && fs.statSync(src).isFile()) {
            try {
              var dst = path.join(d, rel);
              fs.mkdirSync(path.dirname(dst), { recursive: true });
              fs.copyFileSync(src, dst);
              console.log("[psychojs-browser] copied resource:", rel);
            } catch(e) { console.error("[psychojs-browser] copy resource fail:", rel, e.message); }
          }
        });
      }
    } catch(e) { console.error("[psychojs-browser] resource parse/copy fail:", e.message); }
  }

  // Write index.html (ESM module template vs legacy IIFE template)
  fs.writeFileSync(path.join(d, "index.html"), isESM ? generateESMHTML(expName || "experiment") : generateHTML(expName || "experiment"), "utf8");

  // Start HTTP server — probe for a genuinely free port (see getFreePort)
  var port = await getFreePort(9200);
  var mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
    '.wasm': 'application/wasm'
  };
  var server = await new Promise(function(r, j) {
    var s = require('http').createServer(function(req, res) {
      var f = d + req.url.split('?')[0];
      // Directory-index fallback: serve index.html for "/" or any directory path.
      // Without this, the returned URL (http://127.0.0.1:port/) maps to a directory
      // and the server returns 404 — the experiment never loads.
      if ((f.endsWith("/") || (fs.existsSync(f) && fs.statSync(f).isDirectory())) && fs.existsSync(path.join(f, "index.html"))) {
        f = path.join(f, "index.html");
      }
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        var ext = path.extname(f);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(fs.readFileSync(f));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    s.listen(port, "0.0.0.0", function() { r(s); });
    s.once("error", j);
  });
  var url = "http://127.0.0.1:" + port + "/index.html";
  servers[url] = { server: server, dir: d, createdAt: Date.now() };

  // Browser opening is handled by the caller (harmony-python.js) via NAPI openLink
  console.log("[psychojs-browser] Ready at:", url);
  return url;
}

async function saveLog() { return []; }

async function stopServer(address) {
  if (address) {
    var e = servers[address];
    if (e) {
      try { e.server.close(); } catch(_){}
      try { fs.rmSync(e.dir, { recursive: true, force: true }); } catch(_){}
      delete servers[address];
    }
    return;
  }
  for (var k in servers) {
    var s = servers[k];
    try { s.server.close(); } catch(_){}
    try { fs.rmSync(s.dir, { recursive: true, force: true }); } catch(_){}
  }
  for (var k in servers) delete servers[k];
}

// Serve an already-generated experiment directory (e.g. produced by the
// Python .psyexp worker) on a local HTTP server and return its URL.
// Called by index.cjs browserRun when a .psyexp file is compiled via Python.
async function startServerFromDir(dir) {
  var d = dir;
  if (!d || !fs.existsSync(d) || !fs.statSync(d).isDirectory()) {
    throw new Error("[psychojs-browser] startServerFromDir: invalid directory: " + d);
  }
  // If the generator produced its own experiment.html (Python's PsychoJS output,
  // which is ESM and uses <script type="module">), serve that directly instead
  // of the legacy IIFE HTML. Copy it to index.html so the "/" route resolves.
  var genHtml = path.join(d, "experiment.html");
  if (fs.existsSync(genHtml) && !fs.existsSync(path.join(d, "index.html"))) {
    try { fs.copyFileSync(genHtml, path.join(d, "index.html")); }
    catch (e) { console.error("[psychojs-browser] copy experiment.html failed:", e.message); }
  }
  var port = await getFreePort(9200);
  var mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
    '.wasm': 'application/wasm'
  };
  var server = await new Promise(function(r, j) {
    var s = require('http').createServer(function(req, res) {
      var f = path.join(d, req.url.split('?')[0]);
      // Directory-index fallback (same as startServer): serve index.html for
      // "/" or any directory path so the experiment actually loads.
      if ((f.endsWith("/") || (fs.existsSync(f) && fs.statSync(f).isDirectory())) && fs.existsSync(path.join(f, "index.html"))) {
        f = path.join(f, "index.html");
      }
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        var ext = path.extname(f);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(fs.readFileSync(f));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    s.listen(port, "0.0.0.0", function() { r(s); });
    s.once("error", j);
  });
  var url = "http://127.0.0.1:" + port + "/index.html";
  servers[url] = { server: server, dir: d, createdAt: Date.now() };
  console.log("[psychojs-browser] Ready (from dir) at:", url);
  return url;
}

module.exports = { startServer, startServerFromDir, saveLog, stopServer };
