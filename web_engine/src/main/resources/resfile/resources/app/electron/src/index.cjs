const path = require('node:path');
const fs = require("fs");
const proc = require("child_process");
const { app, dialog, BrowserWindow, ipcMain, shell } = require('electron');
// Polyfill: Promise.withResolvers (Node 22+, not available in Electron-OH Node 20.x)
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
  console.log('[D] Promise.withResolvers polyfill installed');
}


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
    dialog.showErrorBox('PsychoPy Debug', 'harmony-python.js load failed: ' + (harmonyErr?.message || harmonyErr) + '\n\n' + (harmonyErr?.stack?.substring(0, 500) || ''));
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
    ipcMain.handle("python.venv.setup", () => true);  // pretend setup succeeded
    ipcMain.handle("python.venv.executable", () => "python3");
    ipcMain.handle("python.venv.installPackage", () => true);
    ipcMain.handle("python.venv.uninstallPackage", () => true);
    ipcMain.handle("python.venv.getPackages", () => []);
    ipcMain.handle("python.venv.getPackageDetails", () => ({}));
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
  // psychoJS browser runner IPC (惰性加载，不阻塞主进程启动)
  // 在当前窗口 loadFile() 加载实验（最稳方案）
  // ★ 浏览器实验运行：起本地 HTTP server → shell.openExternal → 系统浏览器打开
  // Read and parse XLSX conditions file, return JSON
  ipcMain.handle("python.psychojs.readConditions", async (evt, filePath) => {
    try {
      var XLSX = require("xlsx");
      var workbook = XLSX.readFile(filePath);
      var sheet = workbook.Sheets[workbook.SheetNames[0]];
      var json = XLSX.utils.sheet_to_json(sheet);
      return JSON.stringify(json);
    } catch (err) {
      console.error("[psychojs-browser] readConditions failed:", err?.message || err);
      return "[]";
    }
  });

  ipcMain.handle("python.psychojs.browserRun", async (evt, jsCode, expName, conditionsJSON, resourcesJSON, expDir) => {
    console.log("[psychojs-browser] browserRun called, jsCode length:", jsCode?.length, "expName:", expName, "expDir:", expDir);
    try {
      delete require.cache[require.resolve("./psychojs-browser/index.cjs")];
      const psychoJSBrowser = require("./psychojs-browser/index.cjs");
      const url = await psychoJSBrowser.startServer(
        jsCode || "", expName || "experiment", conditionsJSON || "",
        resourcesJSON || "", expDir || ""
      );
      console.log("[psychojs-browser] Opened in system browser:", url);
      return url;
    } catch (err) {
      console.error("[psychojs-browser] Failed:", err?.message || err, err?.stack);
      throw err;
    }
  });
  // 保存实验 log（暂未启用）
  ipcMain.handle("python.psychojs.saveLog", async (evt, logData, savePath) => {
    const psychoJSBrowser = require("./psychojs-browser/index.cjs");
    return await psychoJSBrowser.saveLog(logData, savePath);
  });
  // ★ 停掉浏览器实验 server + 清理
  ipcMain.handle("python.psychojs.browserStop", async (evt, address) => {
    console.log("[psychojs-browser] browserStop called, address:", address);
    try {
      const psychoJSBrowser = require("./psychojs-browser/index.cjs");
      await psychoJSBrowser.stopServer(address);
      return true;
    } catch (err) {
      console.error("[psychojs-browser] stop failed:", err?.message || err);
      return false;
    }
  });
  // 旧路径保留 stub（避免报错）
  ipcMain.handle("python.psychojs.run", () => Promise.resolve());
  ipcMain.handle("python.psychojs.stop", () => Promise.resolve(true));
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
      host: "localhost",
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

  // setup a clipboard
  clipboard = undefined

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
  try {
    console.log('[D] createWindow started');
  // if app is already running...
  if (started) {
    console.log('[D] already started, calling startingWindows()');
    startingWindows()
    return
  }
  // mark started
  started = true
  console.log('[D] creating splash window');
  // create splash
  windows.splash = new BrowserWindow({
    icon: favicon,
    title: "PsychoPy Studio",
    width: 720,
    height: 400,
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true
  });
  windows.splash.loadFile(path.join(__dirname, 'splash.html'));
  windows.splash.center();
  if (prefs.params?.showSplash?.val !== "False") {
    windows.splash.show();
    console.log('[D] splash shown');
  }

  // keep track of ready statuses
  let ready = {
    svelte: Promise.withResolvers()
  }
  console.log('[D] Promise.withResolvers OK, platform=' + process.platform);
  // if on windows, get frame to open with from argv
  if (process.platform === "win32") {
    onFileOpen(undefined, process.argv[isDev ? 2 : 1])
  }
  // start timers 
  let mintime = new Promise((resolve, reject) => setTimeout(resolve, prefs.params?.showSplash?.val !== "False" ? 1000 : 0));
  let maxtime = new Promise((resolve, reject) => setTimeout(resolve, 10000));
  // start the svelte side of things
  if (isDev) {
    // use Vite dev server for development
    logging.log(`Starting Vite dev server at ${svelte.address.host}:${svelte.address.port}`)
    svelte.process = proc.exec(`vite dev --host=${svelte.address.host} --port=${svelte.address.port}`);
    svelte.process.stdout.on("data", msg => {
      let readyMatch = msg.match(
        /➜  Local:   http:\/\/(?<host>[\w\d]+):(?<port>[\w\d]+)/
      )
      if (readyMatch) {
        svelte.address.host = readyMatch.groups.host
        svelte.address.port = readyMatch.groups.port
        ready.svelte.resolve()
        logging.log(
          `Started Vite dev server at ${svelte.address.host}:${svelte.address.port}`
        )
      }
    })
  } else {
    // use express to serve static files in production
    logging.log(`Running: ${process.argv.join(" | ")}`)
    const express = require('express');
    const app = express();

    app.use(express.static(path.join(__dirname, '../../dist'), {
      setHeaders: (res, p) => {
        if (p.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
        if (p.endsWith('.ttf')) res.setHeader('Content-Type', 'font/ttf');
        if (p.endsWith('.woff2')) res.setHeader('Content-Type', 'font/woff2');
        if (p.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        if (p.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
      }
    }));

    // SPA fallback
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.includes('.')) return next();
      const pageDir = path.join(__dirname, '../../dist', req.path.split('/')[1] || '', 'index.html');
      if (fs.existsSync(pageDir)) return res.sendFile(pageDir);
      res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });

    const server = app.listen(svelte.address.port, svelte.address.host, () => {
      logging.log(`Started static server at ${svelte.address.host}:${svelte.address.port}`)
      ready.svelte.resolve();
    });

    svelte.process = { kill: () => server.close() };
  }

  // show when Svelte has loaded and min time has been reached, or when max time has been reached
  console.log('[D] setting up Promise.any, isDev=' + isDev);
  if (!isDev) {
    console.log('[D] production mode, starting Express on ' + svelte.address.host + ':' + svelte.address.port);
  }
  Promise.any([
    Promise.all([
      mintime,
      ...Object.values(ready).map(val => val.promise)
    ]),
    maxtime
  ]).then(
    () => {
      console.log('[D] Promise.any resolved, checking windows...');
      // make sure at least one window is open
      if (!Object.keys(windows).filter(key => key !== "splash").length) {
        console.log('[D] no windows open, calling startingWindows()');
        startingWindows()
      } else {
        console.log('[D] windows already open: ' + Object.keys(windows).filter(key => key !== "splash").join(', '));
      }
    }
  ).catch(err => {
    console.error('[D] Promise.any error:', err);
    dialog.showErrorBox('PsychoPy Debug', 'Promise.any error: ' + (err?.message || err));
  });
  console.log('[D] createWindow setup complete');
};

function startingWindows() {
    let targets
    try {
      targets = JSON.parse(prefs.params?.defaultView?.val)
    } catch {
      targets = ["builder"]
    }
    console.log('[D] startingWindows targets:', JSON.stringify(targets));
    for (let target of targets) {
      console.log('[D] calling newWindow(' + target + ')');
      newWindow(target, true, false).then(
        id => {
          console.log('[D] newWindow(' + target + ') resolved with id=' + id);
          windows[id].webContents.send(
            "showTips", prefs.params?.showStartupTips?.val === "True"
          )
        }
      ).catch(err => {
        console.error('[D] newWindow(' + target + ') error:', err?.message || err);
        dialog.showErrorBox('PsychoPy Debug', 'newWindow error: ' + (err?.message || err));
      });
    }
  }


  async function newWindow(target = null, show = true, fullscreen = false) {
    console.log('[D] newWindow start, target=' + target);
    try {
  // create window
  let win = new BrowserWindow({
    icon: favicon,
    width: 1600,
    height: 900,
    show: false,
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
      shell.openExternal(url);
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
  if (show) {
    let shown = false;
    function showWin() {
      if (shown) return;
      shown = true;
      logging.log(`Loaded ${url}`)
      win.show();
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
    win.once("ready-to-show", evt => showWin());
    // fallback: force show after 8 seconds even if ready-to-show didn't fire
    setTimeout(() => showWin(), 8000);
    win.webContents.on("ipc-message", (evt, tag) => {
      if (tag === "ready") {
        ready.resolve(win.webContents.id)
      }
    })
    // fallback: resolve ready after 10 seconds
    setTimeout(() => {
      if (ready.promise.state !== 'fulfilled') {
        ready.resolve(win.webContents.id)
      }
    }, 10000);
  } else {
    win.once("ready-to-show", evt => ready.resolve(win.webContents.id))
  }
  // wait until ready
  console.log('[D] newWindow waiting for ready promise');
  return await ready.promise
    } catch (nwErr) {
      console.error('[D] newWindow error:', nwErr?.message || nwErr, nwErr?.stack?.substring(0, 300));
      dialog.showErrorBox('PsychoPy Debug', 'newWindow crash: ' + (nwErr?.message || nwErr) + '\n\n' + (nwErr?.stack?.substring(0, 500) || ''));
      throw nwErr;
    }
  }

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
        new: ipcMain.handle("electron.windows.new", async (evt, target) => await newWindow(target)),
        get: ipcMain.handle("electron.windows.get", (evt, target) => Object.keys(windows).filter(
          id => windows[id] && typeof windows[id].isDestroyed === 'function' && !windows[id].isDestroyed()
        ).filter(
          id => String(windows[id].webContents.getURL()).includes(target)
        )),
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
          if (win && win.loadURL) win.loadURL(`http://localhost:8003/${target}`)
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
        save: ipcMain.handle("electron.files.save", (evt, file, content) => fs.writeFileSync(file, content, { encoding: 'utf8', mode: 0o777 })),
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
        openExternal: ipcMain.handle("electron.files.openExternal", (evt, url) => shell.openExternal(url))
      },
      clipboard: {
        get: ipcMain.handle("electron.clipboard.get", (evt) => clipboard),
        set: ipcMain.handle("electron.clipboard.set", (evt, value) => clipboard = value)
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
  console.log('[D] IIFE setup complete, app.whenReady will call createWindow');
  })().catch(err => {
    console.error('[!] FATAL: IIFE crashed:', err?.message || err);
    console.error('[!] Stack:', err?.stack?.substring(0, 800));
    try { dialog.showErrorBox('PsychoPy FATAL', 'IIFE crash: ' + (err?.message || err) + '\n\n' + (err?.stack?.substring(0, 800) || '')); } catch(e) {}
  });
