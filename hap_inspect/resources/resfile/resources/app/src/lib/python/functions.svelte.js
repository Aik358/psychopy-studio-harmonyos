import { status } from "./globals.svelte.js"
import { electron, python } from "$lib/globals.svelte";
import { Version, ppy2py } from "$lib/utils/versions.js";

// Guard: ensure setup only runs once per session
var _setupCompleted = false;
var _setupRunning = false;


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


export async function installPython(version=undefined, forceReinstall=false) {
    status.message = "Installing packages (this may take a few minutes)..."
    status.dlg.message = (
        "### Welcome to PsychoPy for HarmonyOS\n\n" +
        "This is a one-time setup. We're installing the required Python packages:\n\n" +
        "- **PsychoPy** — experiment engine\n" +
        "- **NumPy / SciPy** — scientific computing\n" +
        "- **Matplotlib / Pillow** — graphics\n" +
        "- **Pandas / OpenPyXL** — data & spreadsheets\n" +
        "- **SoundFile** — audio support\n\n" +
        "Please wait while packages download and install. Progress details are shown below."
    )
    status.dlg.shown = true
    status.dlg.busy = true
    // Install all core dependencies via pip
    const ok = await python.venv.installAllDeps().catch(() => false)
    status.dlg.busy = false
    if (ok) {
        status.dlg.message = "### Setup Complete ✓\n\nAll packages installed. You can close this window and start using PsychoPy."
    }
}


export async function setupPython(version=undefined, forceReinstall=false) {
    // Already done — skip
    if (_setupCompleted && !forceReinstall) {
        status.ready.resolve(true)
        return
    }
    // Already in progress — wait for current run
    if (_setupRunning) return
    _setupRunning = true

    // abort if on browser
    if (!python) {
        status.ready.resolve()
        _setupCompleted = true
        _setupRunning = false
        return
    }
    status.ready = Promise.withResolvers();
    status.dismiss = Promise.withResolvers();
    status.ready.promise.finally(
        val => setTimeout(evt => status.dismiss.resolve(val), 2000)
    )
    if (!version || version === "app") {
        version = await electron.version()
    }

    // Step 1: Check Python exists
    status.message = "Looking for Python 3..."
    let hasPython = await python.uv.findPython(version).catch(() => false)
    if (!hasPython) {
        status.message = "Python 3 not found"
        handleError(new Error(
            "Python 3.12+ is required. Install via HNP (HarmonyOS Native Package) or harmonybrew."
        ))
        _setupRunning = false
        return
    }

    // Step 2: Check if psychopy is importable
    status.message = "Checking PsychoPy installation..."
    let setupResult = await python.venv.setup().catch(() => ({ success: false }))
    if (!setupResult || !setupResult.success) {
        if (setupResult && setupResult.missingPsychopy) {
            status.message = "PsychoPy library not installed"
            status.dlg.shown = true
            await installPython(version, true)
        } else if (setupResult && setupResult.missingPython) {
            handleError(new Error("Python not found on this system."))
            _setupRunning = false
            return
        }
    }

    // Step 3: Connect or restart liaison
    status.message = "Connecting to Python..."
    if (await python.liaison.started(version)) {
        status.message = "Python connected"
        status.ready.resolve(true)
        python.ready = true
    } else {
        status.message = "Starting Python backend..."
        await python.liaison.start(version).catch(handleError)
        status.message = "Python backend started"
        status.ready.resolve(true)
    }

    python.liaison.ready(version).then(
        ready => {
            if (ready) {
                python.ready = true
            } else {
                console.warn("[setupPython] liaison not ready, python.ready stays false")
            }
        }
    )

    _setupCompleted = true
    _setupRunning = false
    return python
}