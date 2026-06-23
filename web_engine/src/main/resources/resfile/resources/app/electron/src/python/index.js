import { app, ipcMain } from "electron";

// Stub Python module - returns empty/fallback values for Builder/Coder
// Full Python runner requires native Python runtime on HarmonyOS

app.on("quit", (evt, code) => {
  // nothing to clean up
})

export const handlers = {
    liaison: {
        start: ipcMain.handle("python.liaison.start", async () => { return false; }),
        stop: ipcMain.handle("python.liaison.stop", async () => {}),
        send: ipcMain.handle("python.liaison.send", async (evt, venv, message, timeout) => { return ""; }),
        started: ipcMain.handle("python.liaison.started", async () => { return false; }),
        ready: ipcMain.handle("python.liaison.ready", async () => { return false; })
    },
    venv: {
        setup: ipcMain.handle("python.venv.setup", async () => { return false; }),
        executable: ipcMain.handle("python.venv.executable", async () => { return ""; }),
        installPackage: ipcMain.handle("python.venv.installPackage", async () => {}),
        uninstallPackage: ipcMain.handle("python.venv.uninstallPackage", async () => {}),
        getPackages: ipcMain.handle("python.venv.getPackages", async () => { return []; }),
        getPackageDetails: ipcMain.handle("python.venv.getPackageDetails", async () => { return {}; })
    },
    uv: {
        folder: ipcMain.handle("python.uv.folder", (evt) => { return ""; }),
        executable: ipcMain.handle("python.uv.executable", (evt) => { return ""; }),
        exists: ipcMain.handle("python.uv.exists", (evt) => { return false; }),
        install: ipcMain.handle("python.uv.install", (evt) => {}),
        makeExecutable: ipcMain.handle("python.uv.makeExecutable", (evt, version, pyVersion) => {}),
        findPython: ipcMain.handle("python.uv.findPython", (evt, version) => { return ""; }),
        getEnvironments: ipcMain.handle("python.uv.getEnvironments", (evt) => { return {}; })
    },
    shell: {
        list: ipcMain.handle("python.shell.list", async () => { return []; }),
        send: ipcMain.handle("python.shell.send", async () => {}),
        open: ipcMain.handle("python.shell.open", async () => { return ""; }),
        close: ipcMain.handle("python.shell.close", async () => {})
    },
    scripts: {
        run: ipcMain.handle("python.scripts.run", async () => { return ""; }),
        finished: ipcMain.handle("python.scripts.finished", async () => { return true; }),
        stop: ipcMain.handle("python.scripts.stop", async () => {})
    },
    psychojs: {
        run: ipcMain.handle("python.psychojs.run", async (evt, cwd) => { return ""; }),
        stop: ipcMain.handle("python.psychojs.stop", (evt, address) => {})
    }
}
