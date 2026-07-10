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

  // Write library files
  fs.writeFileSync(path.join(d, "jquery-3.6.0.min.js"), readLib("jquery-3.6.0.min.js"), "utf8");
  fs.writeFileSync(path.join(d, "jquery-ui-1.12.1.min.js"), readLib("jquery-ui-1.12.1.min.js"), "utf8");
  fs.writeFileSync(path.join(d, "jquery-ui-1.12.1.min.css"), readLib("jquery-ui-1.12.1.min.css"), "utf8");
  fs.writeFileSync(path.join(d, "pixi-legacy-5.3.12.min.js"), readLib("pixi-legacy-5.3.12.min.js"), "utf8");
  fs.writeFileSync(path.join(d, "preloadjs-1.0.0.min.js"), readLib("preloadjs-1.0.0.min.js"), "utf8");
  fs.writeFileSync(path.join(d, "psychojs-2025.2.4.iife.js"), readLib("psychojs-2025.2.4.iife.js"), "utf8");

  // Write experiment.js
  fs.writeFileSync(path.join(d, "experiment.js"), expCode, "utf8");

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

  // Write index.html
  fs.writeFileSync(path.join(d, "index.html"), generateHTML(expName || "experiment"), "utf8");

  // Start HTTP server
  var port = 9200 + Object.keys(servers).length;
  var express = require("express");
  var app = express();
  app.use(express.static(d));
  var server = await new Promise(function(r, j) {
    var s = app.listen(port, "127.0.0.1", function() { r(s); });
    s.once("error", j);
  });
  var url = "http://127.0.0.1:" + port + "/";
  servers[url] = { server: server, dir: d, createdAt: Date.now() };

  // Open in system browser
  await shell.openExternal(url).catch(function(e) {
    console.error("[psychojs-browser] openExternal fail:", e);
  });
  console.log("[psychojs-browser] Opened:", url);
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

module.exports = { startServer, saveLog, stopServer };
