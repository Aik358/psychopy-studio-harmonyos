#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
psychopy_worker.py — PsychoPy-Oh backend helper (Python side)

This is the faithful HarmonyOS port of the original PsychoPy Studio
(Windows 2026.1.2) PsychoJS run flow:

    original (Windows):
      1. Svelte writeScript("PsychoJS")  -> experiment.js (ESM)
      2. python.liaison.send("app", {command:"run",
             args:["psychopy.tools.servertools:getPsychoJS"],
             kwargs:{cwd, useVersion}})
                                        -> writes index.html + copies the
                                           psychojs ESM library into cwd
      3. python.psychojs.run(cwd)       -> spawns `python -m http.server`
      4. window.open(http://address)    -> opens system browser

In the port the HTTP serving is done by Node (psychojs-browser/index.cjs
startServerFromDir) and the browser is opened from the main process via
shell.openExternal.  The one piece that still needs a real Python +
psychopy environment is step 2 (and, optionally, compiling the .psyexp to
PsychoJS).  That is exactly what this worker does.

Subcommands (invoked from electron/src/index.cjs):
  generate <psyexpPath> <outDir> [experimentJsPath]
      Assemble a self-contained PsychoJS experiment directory:
        - obtain experiment.js (prefer a pre-built ESM file passed in;
          otherwise compile the .psyexp with a real psychopy install)
        - normalise its `import ... from` to ./lib/psychojs-<ver>.js
        - copy the psychojs ESM library + jquery/pixi/preloadjs into the dir
        - write index.html (the ESM template used by the port)
        - copy the experiment's resource files (conditions/media)
      Prints a JSON line: {"status":"ok","experiment_name":...,
                           "output_dir":..., "files":{...}}
  conditions <xlsxOrCsvPath>
      Read a conditions table and emit {"status":"ok","rows":[...]}.
"""

import os
import sys
import json
import shutil
import subprocess
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
# psychojs libs live in ../psychojs-browser/lib relative to this script
# (electron/src/python  ->  electron/src/psychojs-browser/lib)
LIB_DIR = os.path.join(HERE, "..", "psychojs-browser", "lib")

# Classic <script> deps expected by the ESM HTML (loaded as globals).
ROOT_LIBS = [
    "jquery-3.6.0.min.js",
    "jquery-ui-1.12.1.min.js",
    "jquery-ui-1.12.1.min.css",
    "pixi-legacy-5.3.12.min.js",
    "preloadjs-1.0.0.min.js",
    "psychojs-2026.1.2.iife.js",
]
# ESM library that experiment.js imports from ./lib/
ESM_LIB = "psychojs-2026.1.2.js"
ESM_LIB_VERSION = "2026.1.2"


# --------------------------------------------------------------------------
# ESM index.html template (byte-for-byte the port's _psychojsGenerateHTML +
# _psychojsDialogCSS, so the ESM path is preserved exactly).
# --------------------------------------------------------------------------
_DIALOG_CSS = r""".dialog-container[aria-hidden="true"]{display:none!important}
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
.sn-notifications-container{position:fixed;bottom:20px;right:20px;z-index:10001;display:flex;flex-direction:column;gap:10px}"""

_INDEX_HTML = r"""<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>__EXP_TITLE__ [PsychoPy]</title>
<link rel="stylesheet" href="jquery-ui-1.12.1.min.css">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;overflow:hidden;width:100vw;height:100vh}canvas{display:block}#root{position:absolute;top:0;left:0;width:100%;height:100%}#__error{position:fixed;top:0;left:0;width:100%;max-height:50vh;overflow:auto;background:rgba(0,0,0,0.9);color:#f44;padding:10px;font-family:monospace;font-size:12px;z-index:99999;display:none;white-space:pre-wrap}</style>
<style>__DIALOG_CSS__</style>
</head><body><div id="root"></div><div id="__error"></div>
<script>window.addEventListener("error",function(e){var ov=document.getElementById("__error");if(ov){ov.style.display="block";ov.textContent+="ERROR: "+e.message+"\n"+(e.error&&e.error.stack||"")+"\n";}});</script>
<script>
document.addEventListener("click",function(e){var d=e.target.closest&&e.target.closest(".dialog-container[aria-hidden=\"true\"]");if(d){e.preventDefault();e.stopPropagation();}},true);
</script>
<script src="jquery-3.6.0.min.js"></script>
<script src="jquery-ui-1.12.1.min.js"></script>
<script src="preloadjs-1.0.0.min.js"></script>
<script src="pixi-legacy-5.3.12.min.js"></script>
<script type="module" src="experiment.js"></script>
</body></html>"""


def _log(msg):
    sys.stderr.write(str(msg) + "\n")
    sys.stderr.flush()


def _find_lib_dir():
    candidates = [LIB_DIR,
                 os.path.join(os.getcwd(), "psychojs-browser", "lib"),
                 os.path.join(HERE, "psychojs-browser", "lib")]
    for c in candidates:
        if os.path.isdir(c):
            return c
    return None


def _copy_libs(out_dir):
    lib = _find_lib_dir()
    if not lib:
        _log("WARN: psychojs lib dir not found; skipping lib copy")
        return False
    for name in ROOT_LIBS:
        src = os.path.join(lib, name)
        if os.path.isfile(src):
            shutil.copyfile(src, os.path.join(out_dir, name))
    # ESM library into ./lib/
    src = os.path.join(lib, ESM_LIB)
    if os.path.isfile(src):
        dest = os.path.join(out_dir, "lib", ESM_LIB)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copyfile(src, dest)
    return True


def _build_index_html(exp_name):
    n = (exp_name or "PsychoPy").replace("<", "").replace(">", "")
    html = _INDEX_HTML.replace("__EXP_TITLE__", n)
    html = html.replace("__DIALOG_CSS__", _DIALOG_CSS)
    return html


def _normalize_esm_import(code):
    """Force experiment.js to import the locally-shipped ESM psychojs lib."""
    import re
    pat = re.compile(r'''(from\s+["'])([^"']*psychojs[^"']*)(["'])''')
    repl = r"\1./lib/psychojs-%s.js\3" % ESM_LIB_VERSION
    new, n = pat.subn(repl, code)
    if n == 0:
        # CDN / other relative .js import without the word "psychojs"
        pat2 = re.compile(r'''(from\s+["'])([^"']+\.js)(["'])''')
        new, _ = pat2.subn(repl, code)
    return new


def _compile_via_psychopy(psyexp_path, out_js):
    """Compile a .psyexp to a PsychoJS .js using a real psychopy install.

    Tries an in-process compile first, then falls back to the psychopy CLI
    (both are designed to run headless / PSYCHOPY_NO_GUI=1).
    """
    # Strategy 1: in-process psyexpCompile
    try:
        from psychopy.scripts.psyexpCompile import compileScript
        compileScript(infile=psyexp_path, version=ESM_LIB_VERSION, outfile=out_js)
        if os.path.isfile(out_js) and os.path.getsize(out_js) > 0:
            _log("psychopy in-process compile OK")
            return True
    except Exception as e:
        _log("psychopy in-process compile failed: %s" % e)
    # Strategy 2: psychopy CLI module
    try:
        py = sys.executable
        r = subprocess.run(
            [py, "-m", "psychopy.scripts.psyexpCompile", psyexp_path, out_js],
            capture_output=True, text=True, timeout=180)
        if os.path.isfile(out_js) and os.path.getsize(out_js) > 0:
            _log("psychopy CLI compile OK")
            return True
        _log("psychopy CLI compile failed: %s" % (r.stderr.strip()[:500]))
    except Exception as e:
        _log("psychopy CLI compile error: %s" % e)
    return False


def _copy_resources(out_dir, psyexp_path):
    """Copy sibling resource files (conditions csv/xlsx, media) next to the .psyexp."""
    if not psyexp_path or not os.path.isfile(psyexp_path):
        return
    base = os.path.dirname(os.path.abspath(psyexp_path))
    try:
        for name in os.listdir(base):
            full = os.path.join(base, name)
            if not os.path.isfile(full):
                continue
            ext = name.lower().rsplit(".", 1)[-1] if "." in name else ""
            if ext in ("csv", "xlsx", "png", "jpg", "jpeg", "gif", "bmp",
                       "wav", "mp3", "mp4", "mov", "txt", "json", "csv"):
                try:
                    shutil.copyfile(full, os.path.join(out_dir, name))
                except Exception:
                    pass
    except Exception as e:
        _log("resource copy warn: %s" % e)


def cmd_generate(psyexp_path, out_dir, experiment_js_path=None):
    os.makedirs(out_dir, exist_ok=True)
    exp_name = os.path.splitext(os.path.basename(psyexp_path or "experiment"))[0]

    # 1) Obtain experiment.js content
    js_code = None
    if experiment_js_path and os.path.isfile(experiment_js_path):
        try:
            with open(experiment_js_path, "r", encoding="utf-8") as f:
                js_code = f.read()
        except Exception as e:
            _log("read experimentJsPath failed: %s" % e)

    if not js_code and psyexp_path and psyexp_path.lower().endswith(".psyexp") \
            and os.path.isfile(psyexp_path):
        out_js = os.path.join(out_dir, exp_name + ".js")
        if _compile_via_psychopy(psyexp_path, out_js):
            try:
                with open(out_js, "r", encoding="utf-8") as f:
                    js_code = f.read()
            except Exception:
                js_code = None

    if not js_code and psyexp_path and os.path.isfile(psyexp_path):
        # last resort: an already-exported .js beside the .psyexp
        cand = os.path.join(os.path.dirname(psyexp_path), exp_name + ".js")
        if os.path.isfile(cand):
            try:
                with open(cand, "r", encoding="utf-8") as f:
                    js_code = f.read()
            except Exception:
                js_code = None

    if not js_code:
        return {"status": "error",
                "error": "Could not obtain experiment.js (no pre-built JS file "
                         "and psychopy compile unavailable)"}

    js_code = _normalize_esm_import(js_code)
    with open(os.path.join(out_dir, "experiment.js"), "w", encoding="utf-8") as f:
        f.write(js_code)

    # 2) libs + html + resources
    _copy_libs(out_dir)
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(_build_index_html(exp_name))
    if psyexp_path and os.path.isfile(psyexp_path):
        _copy_resources(out_dir, psyexp_path)

    files = {}
    for root, _, fnames in os.walk(out_dir):
        for fn in fnames:
            p = os.path.join(root, fn)
            files[os.path.relpath(p, out_dir)] = os.path.getsize(p)

    return {"status": "ok",
            "experiment_name": exp_name,
            "output_dir": out_dir,
            "files": files}


def cmd_conditions(path):
    if not path or not os.path.isfile(path):
        return {"status": "ok", "rows": []}
    ext = path.lower().rsplit(".", 1)[-1] if "." in path else ""
    try:
        if ext in ("xlsx", "xlsm"):
            import openpyxl
            wb = openpyxl.load_workbook(path, read_only=True)
            ws = wb.active
            rows = [list(r) for r in ws.iter_rows(values_only=True)]
            wb.close()
            return {"status": "ok", "rows": rows}
    except Exception as e:
        _log("conditions openpyxl failed: %s" % e)
    # fallback: csv / tsv
    import csv
    delim = "\t" if ext == "tsv" else ","
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f, delimiter=delim))
    return {"status": "ok", "rows": rows}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "no subcommand"}))
        return
    sub = sys.argv[1]
    try:
        if sub == "generate":
            psyexp = sys.argv[2] if len(sys.argv) > 2 else None
            out_dir = sys.argv[3] if len(sys.argv) > 3 else None
            js_path = sys.argv[4] if len(sys.argv) > 4 else None
            if not out_dir:
                print(json.dumps({"status": "error",
                                  "error": "generate needs <psyexp> <outDir> [experimentJsPath]"}))
                return
            result = cmd_generate(psyexp, out_dir, js_path)
            print(json.dumps(result))
        elif sub == "conditions":
            path = sys.argv[2] if len(sys.argv) > 2 else None
            result = cmd_conditions(path)
            print(json.dumps(result))
        else:
            print(json.dumps({"status": "error", "error": "unknown subcommand: %s" % sub}))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e),
                          "trace": traceback.format_exc()}))


if __name__ == "__main__":
    main()
