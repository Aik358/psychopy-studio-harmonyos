// Promise.withResolvers polyfill for Node 20.x (Electron-OH)
if (!Promise.withResolvers) {
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

const path = require('node:path');
const fs = require("fs");
const proc = require("child_process");
const { app, dialog, BrowserWindow, ipcMain, shell, clipboard, systemPreferences } = require('electron');
// Request Desktop/Documents/Downloads directory access (HarmonyOS sandbox)
try {
  systemPreferences.requestDirectoryPermission();
  _flog('[init] requestDirectoryPermission called (Desktop/Documents/Downloads)');
} catch(e) {
  _flog('[init] requestDirectoryPermission failed:', e && e.message);
}

// ★ HarmonyOS openExternal helper — tries Electron shell first, then NAPI binding, then aa start
function openExternalHarmony(url) {
  _flog('[openExternal] Attempting to open:', url);

  // 1) Try Electron's built-in shell.openExternal
  try {
    var result = shell.openExternal(url);
    if (result) {
      _flog('[openExternal] shell.openExternal succeeded');
      return true;
    }
    _flog('[openExternal] shell.openExternal returned falsy, falling through');
  } catch (e) {
    _flog('[openExternal] shell.openExternal threw:', e && e.message);
  }

  // 2) Try NAPI binding (registered by ExternalProtocolAdapterBind.ets)
  try {
    if (typeof globalThis.ExternalProtocolAdapter !== 'undefined' && globalThis.ExternalProtocolAdapter.OpenExternal) {
      globalThis.ExternalProtocolAdapter.OpenExternal(url);
      _flog('[openExternal] NAPI ExternalProtocolAdapter.OpenExternal called');
      return true;
    }
  } catch (e) {
    _flog('[openExternal] NAPI failed:', e && e.message);
  }

  // 3) Try FileManagerAdapter.OpenUrlInDefaultBrowser NAPI binding
  try {
    if (typeof globalThis.FileManagerAdapter !== 'undefined' && globalThis.FileManagerAdapter.OpenUrlInDefaultBrowser) {
      globalThis.FileManagerAdapter.OpenUrlInDefaultBrowser(url);
      _flog('[openExternal] NAPI FileManagerAdapter.OpenUrlInDefaultBrowser called');
      return true;
    }
  } catch (e) {
    _flog('[openExternal] NAPI FileManagerAdapter failed:', e && e.message);
  }

  // 4) Fallback: aa start with --ps uri <url> (best effort)
  try {
    proc.execSync(`aa start -a MainAbility -b com.huawei.hwbrowser --ps uri "${url}"`, { timeout: 5000 });
    _flog('[openExternal] aa start browser succeeded');
    return true;
  } catch (e) {
    _flog('[openExternal] aa start failed:', e && e.message);
  }

  // 5) Last resort: copy to clipboard and notify renderer
  try {
    clipboard.writeText(url);
    _flog('[openExternal] URL copied to clipboard as last resort');
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('stderr', `[openExternal] Cannot open URL automatically. URL copied to clipboard: ${url}`);
    }
    return false;
  } catch (e) {
    _flog('[openExternal] clipboard fallback failed:', e && e.message);
  }

  _flog('[openExternal] ALL methods failed for URL:', url);
  return false;
}

// ★ 文件日志 — Electron-OH 的 console.log 不进 hilog，写文件辅助调试白屏根因
const _logFile = path.join(app.getPath("appData"), "psychopy4", "electron-main.log");
function _flog(...args) {
  try {
    const line = `[${new Date().toISOString()}] ${args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}\n`;
    fs.appendFileSync(_logFile, line);
    console.log(line.trim());
  } catch (_) {}
}
_flog('=== Electron main started ===');
_flog('node version:', process.version);
_flog('appData:', app.getPath("appData"));
_flog('__dirname:', __dirname);
_flog('argv:', process.argv);
global._flog = _flog;

// ★ 捕获未处理异常 — 白屏根因诊断
process.on('uncaughtException', (err) => { _flog('!!! uncaughtException:', err && err.stack ? err.stack : err); });
process.on('unhandledRejection', (reason) => { _flog('!!! unhandledRejection:', reason && reason.stack ? reason.stack : reason); });

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
  // ★ HarmonyOS Python backend — real handlers via harmony-python.js
  // Wrapped in try-catch so Python backend failure doesn't block Electron UI
  try {
    const harmonyMod = await import("./harmony-python.js");
    harmonyMod.registerHarmonyPythonHandlers();
    console.log('[D] harmony-python handlers registered');
  } catch (harmonyErr) {
    console.error('[!] Failed to load harmony-python.js:', harmonyErr?.message || harmonyErr);
    console.error('[!] Stack:', harmonyErr?.stack?.substring(0, 500));
    // Register ALL stubs matching preload.js API so frontend doesn't crash
    // Liaison
    ipcMain.handle("python.liaison.ready", () => false);
    ipcMain.handle("python.liaison.send", () => { throw new Error("Python backend not available"); });
    ipcMain.handle("python.liaison.start", () => false);
    ipcMain.handle("python.liaison.stop", () => true);
    ipcMain.handle("python.liaison.started", () => false);
    // UV
    ipcMain.handle("python.uv.exists", () => true);  // say yes so frontend doesn't try to install
    ipcMain.handle("python.uv.folder", () => "/tmp/harmony-python");
    ipcMain.handle("python.uv.executable", () => "python3");
    ipcMain.handle("python.uv.install", () => true);  // pretend install succeeded
    ipcMain.handle("python.uv.makeExecutable", () => "python3");
    ipcMain.handle("python.uv.findPython", () => "python3");
    ipcMain.handle("python.uv.getEnvironments", () => []);
    // Venv
    ipcMain.handle("python.venv.setup", () => ({ success: true }));
    ipcMain.handle("python.venv.executable", () => "python3");
    ipcMain.handle("python.venv.installPackage", () => true);
    ipcMain.handle("python.venv.uninstallPackage", () => true);
    ipcMain.handle("python.venv.getPackages", () => ({}));
    ipcMain.handle("python.venv.getPackageDetails", () => ({}));
    ipcMain.handle("python.venv.installAllDeps", () => false);
    // Shell
    ipcMain.handle("python.shell.list", () => []);
    ipcMain.handle("python.shell.open", () => null);
    ipcMain.handle("python.shell.send", () => "");
    ipcMain.handle("python.shell.close", () => true);
    // Scripts
    ipcMain.handle("python.scripts.run", () => null);
    ipcMain.handle("python.scripts.finished", () => true);
    ipcMain.handle("python.scripts.stop", () => true);
    // Terminal
    ipcMain.handle("terminal.python.start", () => "stub-terminal-0");
    ipcMain.handle("terminal.python.send", () => true);
    ipcMain.handle("terminal.python.close", () => true);
    ipcMain.handle("terminal.python.exec", () => "Python backend not available (stub mode)");
    ipcMain.handle("terminal.python.diagnose", () => JSON.stringify({error: "harmony-python.js failed to load", stack: harmonyErr?.stack?.substring(0, 300)}, null, 2));
    console.log('[D] Full stub Python handlers registered (fallback mode)');
  }
  // ★ psychojs browser runner IPC 由 harmony-python.js 独家注册（其行 660–692）
  // 重复注册会抛 second handler 异常让主进程崩、后续 IPC 全废，故此处不注册
  const pythonHandlers = {};
  const { handlers: gitHandlers } = gitModule;

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
      host: "127.0.0.1",
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

  // setup a clipboard (custom buffer, separate from electron's clipboard module)
  let _clipboardBuffer = undefined

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
  _flog('=== createWindow called ===');
  console.log('[D] createWindow loading builder');
  started = true;

  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
    '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
    '.wasm': 'application/wasm'
  };
  const distDir = path.join(__dirname, '../../dist');

  const server = require('http').createServer((req, res) => {
    const urlPath = req.url.split('?')[0];

    // ★ API routes — handled in-process (no SvelteKit server on HarmonyOS)
    if (urlPath === '/api/plugins') {
      // Built-in plugin list (replaces psychopy.org/plugins.json which is unreachable on HarmonyOS)
      const builtinPlugins = [
        {name: 'PsychoPy', pipname: 'psychopy', icon: '/icons/plugin-psychopy.svg', homepage: 'https://psychopy.org', description: 'Core PsychoPy package', keywords: ['psychopy','experiment']},
        {name: 'NumPy', pipname: 'numpy', icon: '/icons/plugin-numpy.svg', homepage: 'https://numpy.org', description: 'Scientific computing', keywords: ['numpy','math']},
        {name: 'SciPy', pipname: 'scipy', icon: '/icons/plugin-scipy.svg', homepage: 'https://scipy.org', description: 'Scientific computing tools', keywords: ['scipy','math']},
        {name: 'Matplotlib', pipname: 'matplotlib', icon: '/icons/plugin-matplotlib.svg', homepage: 'https://matplotlib.org', description: 'Plotting library', keywords: ['matplotlib','plot']},
        {name: 'Pandas', pipname: 'pandas', icon: '/icons/plugin-pandas.svg', homepage: 'https://pandas.pydata.org', description: 'Data analysis toolkit', keywords: ['pandas','data']},
        {name: 'Pillow', pipname: 'Pillow', icon: '/icons/plugin-pillow.svg', homepage: 'https://python-pillow.org', description: 'Image processing library', keywords: ['pillow','image']},
        {name: 'OpenCV', pipname: 'opencv-python', icon: '/icons/plugin-opencv.svg', homepage: 'https://opencv.org', description: 'Computer vision library', keywords: ['opencv','vision']},
        {name: 'Pyo', pipname: 'pyo', icon: '/icons/plugin-pyo.svg', homepage: 'https://belangeo.github.io/pyo/', description: 'Digital signal processing', keywords: ['pyo','audio']},
        {name: 'Soundfile', pipname: 'soundfile', icon: '/icons/plugin-soundfile.svg', homepage: 'https://python-soundfile.readthedocs.io/', description: 'Audio library', keywords: ['soundfile','audio']},
        {name: 'Pyglet', pipname: 'pyglet', icon: '/icons/plugin-pyglet.svg', homepage: 'https://pyglet.org', description: 'Windowing/multimedia library', keywords: ['pyglet','graphics']}
      ];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(builtinPlugins));
      return;
    }
    if (urlPath === '/api/surveys') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ surveys: [] }));
      return;
    }

    let filePath = distDir + urlPath;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
      return;
    }
    const seg = urlPath.split('/')[1] || '';
    const pageDir = distDir + '/' + seg + '/index.html';
    if (fs.existsSync(pageDir)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(pageDir));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.on('error', (err) => {
    _flog('!!! HTTP server error:', err && err.message);
    console.error('[D] Server error:', err);
  });
  server.listen(8003, '127.0.0.1', () => {
    _flog('HTTP server listening on 127.0.0.1:8003');
    console.log('[D] HTTP server started on 127.0.0.1:8003');
    openMainWindow();  
  });
  function openMainWindow() {
    _flog('=== openMainWindow called ===');
    const mainWin = new BrowserWindow({
      width: 1600, height: 900, show: true,
      frame: true,
      webPreferences: { preload: path.join(__dirname, 'preload.js') }
    });
    mainWin.removeMenu();
    // Register window immediately so showWindow can find it
    windows[mainWin.webContents.id] = mainWin;
    mainWin.webContents.on('console-message', (evt) => {
      console.log('[RENDERER]', evt.message);
    });
    mainWin.webContents.on('did-fail-load', (evt, code, desc) => {
      _flog('!!! did-fail-load:', code, desc);
      console.error('[D] Window load failed:', code, desc);
    });
    _flog('openMainWindow: loadURL http://127.0.0.1:8003/builder');
    mainWin.loadURL('http://127.0.0.1:8003/builder').then(() => {
      _flog('openMainWindow: loadURL builder OK');
      console.log('[D] loadURL initiated');
    }).catch((err) => {
      _flog('!!! openMainWindow loadURL error:', err && err.message);
      console.error('[D] loadURL error:', err);
      fallbackLoadFile(mainWin);
    });
    mainWin.webContents.once('did-finish-load', () => {
      _flog('openMainWindow: did-finish-load builder UI');
      console.log('[D] Window loaded builder UI');
    });
    svelte.process = { kill: () => server.close() };
  }
  function fallbackLoadFile(win) {
    const fallbackPath = path.join(__dirname, '../../.svelte-kit/output/prerendered/pages/builder/index.html');
    _flog('fallbackLoadFile:', fallbackPath, 'exists:', fs.existsSync(fallbackPath));
    console.log('[D] Fallback loading file:', fallbackPath);
    if (fs.existsSync(fallbackPath)) {
      win.loadURL('file://' + fallbackPath);
    }
  }
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
        // ★ HarmonyOS: multi-fallback openExternal
        _flog('[openExternal] setWindowOpenHandler url:', url);
        openExternalHarmony(url);
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
    _flog('=== app.whenReady fired ===');
    createWindow();

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
        // [HarmonyOS-OH] Single-window mode: navigate instead of creating new windows
        new: ipcMain.handle("electron.windows.new", async (evt, target) => {
          let win = windows[evt.sender.id];
          if (win && win.loadURL) {
            let url = `http://${svelte.address.host}:${svelte.address.port}/${target || ''}`;
            _flog('[HarmonyOS] windows.new navigating to:', url);
            logging.log(`[HarmonyOS] windows.new: navigating single window to ${url}`);
            await win.loadURL(url).catch(err => _flog('!!! windows.new loadURL error:', err && err.message));
            return evt.sender.id;
          }
          // fallback to original behavior
          return await newWindow(target);
        }),
        get: ipcMain.handle("electron.windows.get", (evt, target) => {
          // [HarmonyOS-OH] Pure query: only return window if URL already matches
          // Navigation side-effect belongs in windows.new, not here
          let win = windows[evt.sender.id];
          if (win && win.webContents && !win.isDestroyed()) {
            let url = String(win.webContents.getURL());
            if (url.includes(target)) {
              return [evt.sender.id];
            }
          }
          return [];
        }),
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
          if (win && win.loadURL) {
            _flog('[HarmonyOS] windows.navigate to:', target);
            win.loadURL(`http://127.0.0.1:8003/${target}`).then(() => {
              _flog('[HarmonyOS] windows.navigate OK:', target);
              console.log(`[D] Navigated to /${target}`);
            }).catch((err) => {
              _flog('!!! windows.navigate error:', target, err && err.message);
              console.error(`[D] Navigate to /${target} failed:`, err);
            });
            return true;
          }
          _flog('!!! windows.navigate: no window for sender', evt.sender.id);
          return false;
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
        save: ipcMain.handle("electron.files.save", (evt, file, content) => {
          try {
            // Ensure parent directory exists
            const parentDir = path.dirname(file);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }
            fs.writeFileSync(file, content, { encoding: 'utf8', mode: 0o777 });
            return true;
          } catch (err) {
            _flog('[files.save] Write failed:', err && err.message, 'for path:', file);
            // Fallback: write to appData directory
            try {
              const fallbackDir = path.join(app.getPath('appData'), 'psychopy4', 'exports');
              if (!fs.existsSync(fallbackDir)) {
                fs.mkdirSync(fallbackDir, { recursive: true });
              }
              const fallbackPath = path.join(fallbackDir, path.basename(file));
              fs.writeFileSync(fallbackPath, content, { encoding: 'utf8', mode: 0o777 });
              _flog('[files.save] Fallback write succeeded at:', fallbackPath);
              // Notify renderer about fallback
              for (const win of BrowserWindow.getAllWindows()) {
                win.webContents.send('stderr', `[files.save] Original path unwritable, saved to: ${fallbackPath}`);
              }
              return fallbackPath;
            } catch (err2) {
              _flog('[files.save] Fallback also failed:', err2 && err2.message);
              throw err2;
            }
          }
        }),
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
        openExternal: ipcMain.handle("electron.files.openExternal", (evt, url) => {
          _flog('[openExternal] IPC openExternal url:', url);
          return openExternalHarmony(url);
        })
      },
      clipboard: {
        get: ipcMain.handle("electron.clipboard.get", (evt) => _clipboardBuffer),
        set: ipcMain.handle("electron.clipboard.set", (evt, value) => _clipboardBuffer = value)
      },
      authenticatePavlovia: ipcMain.handle("electron.authenticatePavlovia", (evt, url) => authenticatePavlovia(url)),
      version: ipcMain.handle("electron.version", (evt) => appVersion),
      platform: ipcMain.handle("electron.platform", (evt) => process.platform),
      quit: ipcMain.handle("electron.quit", (evt) => app.quit())
    },
    // python: pythonHandlers, // TODO: uncomment when Python backend is adapted
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
