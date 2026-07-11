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
    if ("error" in err) {
        err = err.error
    }
    console.error(err)
    status.ready.reject(err)
}


/**
 * Check whether the Python backend IPC handlers are registered.
 * @returns {Promise<boolean>}
 */
async function isPythonBackendAlive() {
    try {
        if (python?.harmony?.isHarmonyOS) {
            await python.harmony.isHarmonyOS();
            return true;
        }
        if (python?.uv?.exists) {
            await python.uv.exists();
            return true;
        }
        return false;
    } catch (err) {
        const msg = String(err?.message || err);
        if (msg.includes("No handler registered") || msg.includes("does not exist")) {
            return false;
        }
        return true;
    }
}


/**
 * Enter fallback mode: Python backend is unavailable or incomplete.
 * Runs diagnostics and shows actionable guidance.
 * 
 * @param {string} reason - Why we're in fallback mode
 * @param {object} extra - Extra info { error, diag }
 */
async function enterFallbackMode(reason, extra = {}) {
    const { error = null } = extra;

    // Run full diagnostics (if backend is alive enough to answer)
    let diag = null;
    let guidance = "";
    try {
        if (python?.harmony?.diagnose) {
            diag = await python.harmony.diagnose();
            // Import guidance generator from backend
            if (python?.harmony?.guidance) {
                guidance = await python.harmony.guidance();
            }
        }
    } catch (_) {
        // Backend too dead even for diagnostics
    }

    let diagMessage = "### ⚠️ Python 连接失败 — 已进入备用模式\n\n";
    diagMessage += `**原因:** ${reason}\n\n`;

    if (diag) {
        // Use backend-generated guidance
        if (guidance) {
            diagMessage = guidance;
        } else {
            // Fallback: generate our own summary
            diagMessage += `**平台:** ${diag.isHarmonyOS ? "HarmonyOS" : diag.platform}\n`;
            diagMessage += `**系统 Python:** ${diag.python ? "✅ " + diag.python : "❌ 未找到"}\n`;
            if (diag.pythonVersion) {
                diagMessage += `**版本:** ${diag.pythonVersion} ${diag.pythonOk ? "✅" : "❌ (需≥3.9)"}\n`;
            }
            diagMessage += `**Harmonybrew:** ${diag.harmonybrew ? "✅" : "❌"}\n`;
            if (diag.missingRequired?.length > 0) {
                diagMessage += `**缺少依赖:** ${diag.missingRequired.map(m => m.pip).join(", ")}\n`;
            }
            diagMessage += `**推荐方案:** ${diag.recommendation}\n`;
        }
    } else {
        // Backend completely dead — can't even run diagnostics
        diagMessage += "Python 后端模块加载失败，无法运行诊断。\n\n";
        diagMessage += "请检查 Electron 主进程日志：\n";
        diagMessage += "1. `extract-zip`、`tar`、`tcp-port-used` 等 npm 依赖是否可用\n";
        diagMessage += "2. `python/index.js` 导入是否成功\n";
        diagMessage += "3. 查看 `[D] Python backend FAILED to load` 日志\n";
    }

    if (error) {
        diagMessage += `\n**错误详情:**\n\`\`\`\n${String(error).substring(0, 800)}\n\`\`\`\n`;
    }

    diagMessage += "\n---\n**当前状态:** Builder 编辑器可用，以下功能不可用：\n";
    diagMessage += "- ❌ Python 实验运行\n- ❌ Coder 终端\n- ❌ 条件文件读取\n";
    diagMessage += "\n修复后点击「重试」重新连接 Python。";

    status.message = "Python 不可用 — 备用模式";
    status.dlg.message = diagMessage;
    status.dlg.shown = true;
    status.dlg.busy = false;
    status.logs += `\n[Fallback] ${reason}\n`;
    if (error) status.logs += `[Error] ${String(error)}\n`;

    // Store diag for auto-install button
    status._diag = diag;

    status.ready.resolve(false);
}


/**
 * Attempt automatic installation of missing packages.
 * Uses system Python pip --user, or venv, or harmonybrew.
 */
async function attemptAutoInstall() {
    status.dlg.busy = true;
    status.message = "正在安装缺失的依赖...";
    status.logs += "\n[AutoInstall] Starting...\n";

    try {
        if (python?.harmony?.autoInstall) {
            const result = await python.harmony.autoInstall();
            status.logs += `[AutoInstall] Result: ${JSON.stringify(result.results || result)}\n`;
            
            if (result.success) {
                status.message = "依赖安装成功！";
                status.logs += "[AutoInstall] All packages installed successfully.\n";
                status.dlg.busy = false;
                // Retry setup
                return await setupPython(undefined, true);
            } else {
                // Some packages failed
                const failed = (result.results || []).filter(r => !r.success);
                status.logs += `[AutoInstall] Failed: ${failed.map(f => f.package).join(", ")}\n`;
                
                // Check if we should try venv approach
                if (result.diag?.venvAvailable && result.diag?.recommendation !== "system_python") {
                    status.dlg.message = "### ⚠️ --user 安装失败，尝试创建独立 venv\n\n" +
                        "系统 Python 拒绝了 `--user` 安装。将创建一个独立的虚拟环境 (venv) 来安装依赖。\n" +
                        "venv 是完全隔离的，不会影响系统其他程序。\n\n" +
                        "点击「创建 venv」继续。";
                    // Will be handled by dialog button
                } else {
                    status.dlg.message = "### ⚠️ 部分依赖安装失败\n\n" +
                        `失败的包: ${failed.map(f => f.package).join(", ")}\n\n` +
                        "可能原因：\n" +
                        "- 系统不允许安装（权限不足）\n" +
                        "- 网络问题（无法访问 PyPI）\n" +
                        "- 包需要编译但缺少编译工具\n\n" +
                        "建议尝试：\n" +
                        "1. 手动安装：`pip3 install " + failed.map(f => f.package).join(" ") + "`\n" +
                        "2. 使用 harmonybrew：`brew install python@3.12` 然后重试\n" +
                        "3. 使用 venv：`python3 -m venv ~/.psychopy-venv` 后在 venv 中安装\n";
                }
                status.dlg.busy = false;
            }
        } else {
            status.logs += "[AutoInstall] autoInstall handler not available\n";
            status.dlg.busy = false;
        }
    } catch (err) {
        status.logs += `[AutoInstall] Error: ${String(err)}\n`;
        status.dlg.busy = false;
        
        // If auto-install failed, show manual instructions
        status.dlg.message = "### ❌ 自动安装失败\n\n" +
            `**错误:** ${String(err).substring(0, 300)}\n\n` +
            "请手动安装 Python 依赖：\n\n" +
            "```bash\n" +
            "# 方式 1：pip --user 安装\n" +
            "pip3 install --user numpy scipy pillow pyglet websockets esprima\n" +
            "pip3 install --user psychopy-lib --no-deps\n\n" +
            "# 方式 2：venv 隔离安装（推荐，不影响系统）\n" +
            "python3 -m venv ~/.psychopy-venv\n" +
            "~/.psychopy-venv/bin/pip install numpy scipy pillow pyglet websockets esprima\n" +
            "~/.psychopy-venv/bin/pip install psychopy-lib --no-deps\n\n" +
            "# 方式 3：harmonybrew（如系统无 Python）\n" +
            "brew install python@3.12\n" +
            "```\n\n" +
            "安装完成后点击「重试」。";
    }
}


/**
 * Create a venv and install packages there (safe fallback).
 */
async function createVenvAndInstall() {
    status.dlg.busy = true;
    status.message = "正在创建虚拟环境...";
    status.logs += "\n[Venv] Creating isolated venv...\n";

    // This would call a backend handler to:
    // 1. python3 -m venv ~/.psychopy-venv
    // 2. ~/.psychopy-venv/bin/pip install <packages>
    // For now, we guide the user
    status.dlg.message = "### 创建虚拟环境\n\n" +
        "请在终端中执行以下命令：\n\n" +
        "```bash\n" +
        "# 1. 创建 venv\n" +
        "python3 -m venv ~/.psychopy-venv\n\n" +
        "# 2. 安装依赖\n" +
        "~/.psychopy-venv/bin/pip install numpy scipy pillow pyglet websockets esprima\n" +
        "~/.psychopy-venv/bin/pip install psychopy-lib --no-deps\n" +
        "```\n\n" +
        "安装完成后点击「重试」。";
    status.dlg.busy = false;
}


export async function installPython(version=undefined, forceReinstall=false) {
    if (!version || version === "app") {
        version = await electron.version()
    }
    let prerelease
    if (version === "dev") {
        prerelease = true
    } else if (Version.parse(version).extra) {
        prerelease = true
        version = Version.parse(version).format("patch")
    } else {
        prerelease = false
    }
    try {
        version = Version.parse(version).format("patch")
    } catch {}
    let pyVersion
    if (version === "dev") {
        pyVersion = "3.10"
    } else {
        version = Version.parse(version)
        if (version.olderThan("2022.1.0")) {
            version = new Version("2022.1.*")
        }
        pyVersion = ppy2py(version)
        version = version.format()
    }
    if (!forceReinstall) {
        if (await python.uv.findPython(version).catch(handleError)) {
            return
        }
    }
    status.message = "Installing Python and PsychoPy library..."
    status.dlg.message = (
        `### Installing Python (${pyVersion}) and PsychoPy library (${version ? version : "latest version"})...\n` +
        `This may take some time and, unfortunately, cannot be done in the background. Once it's finished installing, you won't have to see this message again.`
    )
    status.dlg.shown = true
    status.dlg.busy = true
    await python.uv.makeExecutable(version, pyVersion).catch(handleError)
    await python.venv.setup(version, prerelease)
    status.dlg.busy = false
}


export async function setupPython(version=undefined, forceReinstall=false) {
    // abort if on browser
    if (!python) {
        status.ready.resolve()
        return
    }
    // reset state
    status.ready = Promise.withResolvers();
    status.dismiss = Promise.withResolvers();
    status.ready.promise.finally(
        val => setTimeout(evt => status.dismiss.resolve(val), 2000)
    )
    if (!version || version === "app") {
        version = await electron.version()
    }

    // === Step 0: Check if Python backend (IPC handlers) is alive ===
    status.message = "Checking Python backend..."
    const backendAlive = await isPythonBackendAlive();
    if (!backendAlive) {
        await enterFallbackMode(
            "Python IPC handlers 未注册（python/index.js 加载失败）"
        );
        return;
    }

    // === Step 1: Run diagnostics on HarmonyOS ===
    let diag = null;
    try {
        if (python?.harmony?.diagnose) {
            diag = await python.harmony.diagnose();
        }
    } catch (err) {
        console.warn("[setupPython] Diagnostics failed:", err);
    }

    if (diag?.isHarmonyOS) {
        // HarmonyOS path with full diagnostics

        if (!diag.python || !diag.pythonOk) {
            // No suitable system Python
            await enterFallbackMode(
                diag.python
                    ? `系统 Python 版本过低 (${diag.pythonVersion}，需 ≥3.9)`
                    : "鸿蒙设备上未检测到 Python3",
                { diag }
            );
            return;
        }

        // We have a usable system Python
        if (diag.missingRequired.length > 0) {
            // Packages missing — try auto-install first
            status.message = `安装缺失依赖 (${diag.missingRequired.length} 个包)...`
            status.dlg.message = "### 📦 检测到缺少 Python 依赖\n\n" +
                (await python.harmony.guidance?.() || "") +
                "\n\n点击「自动安装」将使用 pip 安装缺失的包。";
            status.dlg.shown = true;
            status.dlg.busy = false;  // Allow user to click "Auto Install"
            status._diag = diag;

            // Auto-attempt installation
            await attemptAutoInstall();
            
            // Re-check after install
            try {
                diag = await python.harmony.diagnose();
            } catch (_) {}

            if (diag?.missingRequired?.length > 0) {
                // Still missing — enter fallback with full guidance
                await enterFallbackMode(
                    "部分依赖安装失败，需要手动安装",
                    { diag }
                );
                return;
            }
        }

        // All packages present — start liaison
        status.message = `使用系统 Python (${diag.pythonVersion})...`
        status.logs += `[HarmonyOS] Python ready: ${diag.python}\n`;

        status.message = "Connecting Python"
        let alreadyStarted = false;
        try {
            alreadyStarted = await python.liaison.started(version);
        } catch { /* ignore */ }

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
                await enterFallbackMode(
                    "Liaison 启动失败",
                    { error: err, diag }
                );
                return;
            }
        }

        python.liaison.ready(version).then(
            evt => { python.ready = true }
        ).catch(() => {})
        return;
    }

    // === Step 2: Standard (non-HarmonyOS or no diag) path ===
    status.message = "Checking Python..."
    let hasUV = await python.uv.exists().catch(handleError)
    if (!hasUV || forceReinstall) {
        status.message = "Downloading UV (a Python installer)..."
        status.dlg.message = (
            "### Downloading UV (a Python installer)...\n" +
            "This is a program we use to install Python. Once it's finished installing, you won't have to see this message again."
        )
        status.dlg.shown = true
        status.dlg.busy = true
        await python.uv.install().catch(handleError)
        status.dlg.busy = false
    }
    let hasPython = await python.uv.findPython(version).catch(handleError)
    if (!hasPython || forceReinstall) {
        await installPython(version, forceReinstall)
    }
    status.message = "Connecting Python"
    if (await python.liaison.started(version)) {
        status.message = "Connected Python"
        status.ready.resolve(true)
    } else {
        status.message = "Starting Python..."
        await python.liaison.start(version).catch(handleError)
        status.message = "Successfully started Python"
        status.ready.resolve(true)
    }
    python.liaison.ready(version).then(
        evt => { python.ready = true }
    )

    return python
}
