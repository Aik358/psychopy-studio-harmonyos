import { status } from "./globals.svelte.js"
import { electron, python } from "$lib/globals.svelte";
import { Version, ppy2py } from "$lib/utils/versions.js";


/**
 * Tries to safely convert an error to a string which can be displayed in the small popup, while 
 * also printing the full thing to console
 * 
 * @param {error} err 
 */
function handleError(err) {
    // get error attribute if there is one
    if ("error" in err) {
        err = err.error
    }
    // log to console
    console.error(err)
    // send to popup
    status.ready.reject(err)
}


/**
 * Check whether a given IPC channel is registered (i.e. the Python backend is alive).
 * @param {string} channel - e.g. "python.uv.exists"
 * @returns {Promise<boolean>}
 */
async function isPythonBackendAlive() {
    try {
        // Cheapest probe: ask harmony.isHarmonyOS — it's synchronous and always registered
        // if python/index.js loaded successfully.
        if (python?.harmony?.isHarmonyOS) {
            await python.harmony.isHarmonyOS();
            return true;
        }
        // Fallback: try uv.exists
        if (python?.uv?.exists) {
            await python.uv.exists();
            return true;
        }
        return false;
    } catch (err) {
        // If we get "No handler registered", backend is dead
        const msg = String(err?.message || err);
        if (msg.includes("No handler registered") || msg.includes("does not exist")) {
            return false;
        }
        // Other errors mean backend IS alive but the operation failed
        return true;
    }
}


/**
 * Detect whether we're running on HarmonyOS and have native Python available.
 * @returns {Promise<{harmony: boolean, python: string|null, version: string|null}>}
 */
async function detectHarmonyPython() {
    let harmony = false;
    let nativePy = null;
    let pyVer = null;
    try {
        if (python?.harmony?.isHarmonyOS) {
            harmony = await python.harmony.isHarmonyOS();
        }
    } catch { /* ignore */ }
    if (harmony) {
        try {
            nativePy = await python.harmony.nativePython();
        } catch { /* ignore */ }
        try {
            pyVer = await python.harmony.pythonVersion();
        } catch { /* ignore */ }
    }
    return { harmony, python: nativePy, version: pyVer };
}


/**
 * Enter fallback mode: Python backend is unavailable.
 * Shows a diagnostic dialog with actionable guidance.
 * @param {string} reason - Why we're in fallback mode
 * @param {object} info - Extra diagnostic info
 */
function enterFallbackMode(reason, info = {}) {
    const { harmony = false, nativePython = null, pyVersion = null, error = null } = info;

    let diagMessage = "### ⚠️ Python 连接失败 — 已进入备用模式\n\n";
    diagMessage += `**原因:** ${reason}\n\n`;

    if (harmony) {
        diagMessage += "**环境:** HarmonyOS (鸿蒙)\n";
        if (nativePython) {
            diagMessage += `**系统 Python:** 找到 \`${nativePython}\`\n`;
            if (pyVersion) diagMessage += `**Python 版本:** ${pyVersion}\n`;
            diagMessage += "\nPython 已找到但后端启动失败。请检查：\n";
            diagMessage += "1. `websockets` 库是否已安装（`pip3 install websockets --user`）\n";
            diagMessage += "2. `psychopy-lib` 是否已安装（`pip3 install psychopy-lib --no-deps --user`）\n";
            diagMessage += "3. `liaison_shim.py` 文件是否存在且完整\n";
            diagMessage += "4. 查看下方日志获取详细错误信息\n";
        } else {
            diagMessage += "**系统 Python:** ❌ 未找到\n\n";
            diagMessage += "鸿蒙设备上未检测到 Python3。请尝试以下操作：\n";
            diagMessage += "1. 安装 HNP Python：在鸿蒙终端中执行 `hnp install python.org/python_3.12`\n";
            diagMessage += "2. 或安装 Termux 并通过 `pkg install python` 安装\n";
            diagMessage += "3. 安装后重启应用\n";
        }
    } else {
        diagMessage += "**环境:** 非鸿蒙 (Windows/Linux/macOS)\n";
        diagMessage += "\nPython 后端未正确加载。请检查：\n";
        diagMessage += "1. Electron 主进程中 Python 模块是否成功导入\n";
        diagMessage += "2. `extract-zip`、`tar`、`tcp-port-used` 等依赖是否安装\n";
        diagMessage += "3. 查看 Electron 主进程日志获取导入错误\n";
    }

    if (error) {
        diagMessage += `\n**错误详情:**\n\`\`\`\n${String(error).substring(0, 500)}\n\`\`\`\n`;
    }

    diagMessage += "\n---\n**当前状态:** Builder 编辑器可用（代码生成、保存、导出），但以下功能不可用：\n";
    diagMessage += "- ❌ Python 实验运行\n- ❌ Coder 终端\n- ❌ 条件文件读取（xlsx/csv）\n- ❌ PsychoJS 本地服务器\n";
    diagMessage += "\n修复后点击「重试」重新连接 Python。";

    status.message = "Python 不可用 — 备用模式";
    status.dlg.message = diagMessage;
    status.dlg.shown = true;
    status.dlg.busy = false;
    status.logs += `\n[Fallback] ${reason}\n`;
    if (error) status.logs += `[Error] ${String(error)}\n`;

    // Resolve ready as false — app continues in degraded mode
    status.ready.resolve(false);
}


export async function installPython(version=undefined, forceReinstall=false) {
    // make sure we have a psychopy version
    if (!version || version === "app") {
        version = await electron.version()
    }
    // is this a prerelease version?
    let prerelease
    if (version === "dev") {
        prerelease = true
    } else if (Version.parse(version).extra) {
        prerelease = true
        version = Version.parse(version).format("patch")
    } else {
        prerelease = false
    }
    // remove any dogfood details from version
    try {
        version = Version.parse(version).format("patch")
    } catch {}
    // get python version
    let pyVersion
    if (version === "dev") {
        // for dev or app, assume python 3.10
        pyVersion = "3.10"
    } else {
        // make sure we have a Version object
        version = Version.parse(version)
        // oldest version we can do is 2022.1 as it's the first to use Python >3.8
        if (version.olderThan("2022.1.0")) {
            console.warn(
                `Version ${version.format()} of PsychoPy is not supported in PsychoPy Studio as it ` +
                `cannot run in Python >=3.8. Using the oldest compatible version (2022.1).`
            )
            version = new Version("2022.1.*")
        }
        // get python version matching psychopy version
        pyVersion = ppy2py(version)
        // convert back to string (serializable)
        version = version.format()
    }
    // if installed and not forcing a reinstall, do nothing
    if (!forceReinstall) {
        if (
            await python.uv.findPython(
                version
            ).catch(handleError)
        ) {
            return
        }
    }
    // open dialog to show progress
    status.message = "Installing Python and PsychoPy library..."
    status.dlg.message = (
        `### Installing Python (${pyVersion}) and PsychoPy library (${version ? version : "latest version"})...\n` +
        `This may take some time and, unfortunately, cannot be done in the background. Once it's finished installing, you won't have to see this message again.`
    )
    status.dlg.shown = true
    status.dlg.busy = true
    // create venv
    await python.uv.makeExecutable(
        version, pyVersion
    ).catch(handleError)
    // install packages
    await python.venv.setup(version, prerelease)
    // mark as done
    status.dlg.busy = false
}


export async function setupPython(version=undefined, forceReinstall=false) {
    // abort if on browser
    if (!python) {
        status.ready.resolve()
        return
    }
    // new promises
    status.ready = Promise.withResolvers();
    status.dismiss = Promise.withResolvers();
    // once status resolves, dismiss message after a brief pause
    status.ready.promise.finally(
        val => setTimeout(evt => status.dismiss.resolve(val), 2000)
    )
    // make sure we have a psychopy version
    if (!version || version === "app") {
        version = await electron.version()
    }

    // === Step 0: Check if Python backend (IPC handlers) is alive ===
    status.message = "Checking Python backend..."
    const backendAlive = await isPythonBackendAlive();
    if (!backendAlive) {
        // Backend handlers not registered — enter fallback mode
        // Try to detect HarmonyOS for tailored guidance
        let harmonyInfo = {};
        try {
            // Direct preload probe — harmony.isHarmonyOS might not be registered either
            // so we check via a different signal
            if (python?.harmony?.isHarmonyOS) {
                harmonyInfo.harmony = await python.harmony.isHarmonyOS().catch(() => false);
                if (harmonyInfo.harmony) {
                    harmonyInfo.nativePython = await python.harmony.nativePython().catch(() => null);
                    harmonyInfo.pyVersion = await python.harmony.pythonVersion().catch(() => null);
                }
            }
        } catch { /* ignore */ }

        enterFallbackMode(
            "Python IPC handlers 未注册（python/index.js 加载失败）",
            harmonyInfo
        );
        return;
    }

    // === Step 1: Detect HarmonyOS + native Python ===
    const hmInfo = await detectHarmonyPython();
    if (hmInfo.harmony && hmInfo.python) {
        // HarmonyOS with native Python — skip UV entirely
        status.message = `Using system Python (${hmInfo.version || "?"})...`
        status.logs += `[HarmonyOS] Native Python: ${hmInfo.python}\n`

        // Check if Python is already running via liaison
        status.message = "Connecting Python"
        let alreadyStarted = false;
        try {
            alreadyStarted = await python.liaison.started(version);
        } catch {
            // liaison.started might fail if handler is stub
        }

        if (alreadyStarted) {
            status.message = "Connected Python"
            status.ready.resolve(true)
        } else {
            status.message = "Starting Python..."
            try {
                await python.liaison.start(version);
                status.message = "Successfully started Python"
                status.ready.resolve(true)
            } catch (err) {
                // Liaison start failed — enter fallback with diagnostic info
                enterFallbackMode(
                    "Liaison 启动失败",
                    {
                        harmony: true,
                        nativePython: hmInfo.python,
                        pyVersion: hmInfo.version,
                        error: err
                    }
                );
                return;
            }
        }

        // mark python global as ready once Liaison has started
        python.liaison.ready(version).then(
            evt => { python.ready = true }
        ).catch(() => {
            // Liaison ready failed — already in fallback from above
        })
        return;
    }

    if (hmInfo.harmony && !hmInfo.python) {
        // HarmonyOS but no Python found
        enterFallbackMode(
            "鸿蒙设备上未检测到 Python3",
            { harmony: true, nativePython: null }
        );
        return;
    }

    // === Step 2: Standard (non-HarmonyOS) path — UV-based installation ===
    // do we already have UV?
    status.message = "Checking Python..."
    let hasUV = await python.uv.exists().catch(handleError)
    // install UV
    if (!hasUV || forceReinstall) {
        // open dialog to show progress
        status.message = "Downloading UV (a Python installer)..."
        status.dlg.message = (
            "### Downloading UV (a Python installer)...\n" +
            "This is a program we use to install Python. Once it's finished installing, you won't have to see this message again."
        )
        status.dlg.shown = true
        status.dlg.busy = true
        // do install
        await python.uv.install().catch(handleError)
        status.dlg.busy = false
    }
    // do we already have Python?
    let hasPython = await python.uv.findPython(version).catch(handleError)
    // install Python
    if (!hasPython || forceReinstall) {
        // kill any existing process
        // await python.liaison.stop("app")
        await installPython(version, forceReinstall)
    }
    // is Python already running?
    status.message = "Connecting Python"
    if (await python.liaison.started(version)) {
        // mark as connected
        status.message = "Connected Python"
        status.ready.resolve(true)
    } else {
        // start python
        status.message = "Starting Python..."
        await python.liaison.start(version).catch(handleError)
        // mark success
        status.message = "Successfully started Python"
        status.ready.resolve(true)
    }
    // mark python global as ready once Liaison has started
    python.liaison.ready(version).then(
        evt => {
            python.ready = true
        }
    )

    return python
}
