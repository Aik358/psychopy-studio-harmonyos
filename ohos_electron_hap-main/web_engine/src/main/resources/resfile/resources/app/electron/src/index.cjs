const path = require('node:path');
const fs = require("fs");
const proc = require("child_process");
const { app, dialog, BrowserWindow, ipcMain, shell } = require('electron');

// make sure psychopy4 folder exists before importing subpackages
if (!fs.existsSync(path.join(app.getPath("appData"), "psychopy4"))) {
  fs.mkdirSync(
    path.join(app.getPath("appData"), "psychopy4")
  )
}

// Load all ES Modules via dynamic import (cannot require ESM from CJS)
(async () => {
  const [loggingModule, usageModule, versionModule, pythonModule, gitModule] = await Promise.all([
    import("./logging.js"),
    import("./usage.js"),
    import("./version.js"),
    import("./python/index.js"),
    import("./git.js")
  ]);

  const logging = loggingModule.default;
  const { UsageReport } = usageModule;
  const { appVersion, isDev } = versionModule;
  const { handlers: pythonHandlers } = pythonModule;
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
  console.log('[D] createWindow loading builder');
  started = true;

  const express = require('express');
  const expressApp = express();
  const distPath = path.join(__dirname, '../../dist');
  expressApp.use(express.static(distPath, {
    setHeaders: (res, p) => {
      if (p.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
      if (p.endsWith('.ttf')) res.setHeader('Content-Type', 'font/ttf');
      if (p.endsWith('.woff2')) res.setHeader('Content-Type', 'font/woff2');
      if (p.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
      if (p.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    }
  }));
  expressApp.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.includes('.')) return next();
    const pageDir = path.join(distPath, req.path.split('/')[1] || '', 'index.html');
    if (fs.existsSync(pageDir)) return res.sendFile(pageDir);
    next();
  });
  
  const server = expressApp.listen(8003, 'localhost', () => {
    console.log('[D] Express started');
    
    const mainWin = new BrowserWindow({
      width: 1600, height: 900, show: true,
      frame: true,
      webPreferences: { preload: path.join(__dirname, 'preload.js') }
    });
    mainWin.removeMenu();
    mainWin.loadURL('http://localhost:8003/builder');
    
    // Store window for IPC
    mainWin.webContents.once('did-finish-load', () => {
      windows[mainWin.webContents.id] = mainWin;
    });
    
    svelte.process = { kill: () => server.close() };
  });
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
        devtools: ipcMain.handle("electron.windows.devtools", (evt, id) => {
          let win = windows[id || evt.sender.id]
          if (win && win.openDevTools) win.openDevTools()
        }),
        close: ipcMain.handle("electron.windows.close", (evt, id) => {
          let win = windows[id || evt.sender.id]
          if (win && win.close) win.close()
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
    python: pythonHandlers,
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
