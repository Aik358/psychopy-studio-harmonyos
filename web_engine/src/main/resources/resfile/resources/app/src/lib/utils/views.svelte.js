import { electron } from "$lib/globals.svelte";
import { resolve } from "$app/paths"
import { goto } from "$app/navigation"
import { flushBeforeNavigate } from "$lib/sharedViewStore.svelte.js";


/**
 * Open an external URL in the system default browser.
 * Electron-OH single-window mode: window.open() would hijack the current
 * window or fail. Use shell.openExternal via IPC instead.
 *
 * @param {string} url URL to open externally
 * @param {string} [fallbackTarget] optional internal route fallback if no electron
 */
export async function openExternal(url, fallbackTarget) {
    if (electron && typeof electron.files?.openExternal === "function") {
        try {
            await electron.files.openExternal(url)
            return
        } catch (e) {
            // Electron-OH: shell.openExternal failed (no browser intent handler?)
            console.warn('[openExternal] IPC failed, falling back:', e)
        }
    }
    // In Electron-OH single-window mode, window.open is intercepted by
    // setWindowOpenHandler which calls shell.openExternal again — avoid loop.
    // Only use window.open in pure browser/dev mode (no electron).
    if (!electron && typeof window !== "undefined" && typeof window.open === "function") {
        window.open(url, "_blank")
    } else if (fallbackTarget) {
        goto(`/${fallbackTarget}`)
    } else {
        // Last resort: log and show URL in console for manual copy
        console.warn('[openExternal] Cannot open URL externally:', url)
    }
}


/**
 * Open a new window (or a new tab in browser mode)
 * 
 * @param {string} target URL to target for this window (will be appended to the root URL)
 */
export function newWindow(target) {
    if (electron) {
        return electron.windows.new(target);
    } else {
        return window.open(resolve(`/${target}`))
    }
}


/**
 * Open a given file in a window matching the target URL (only available in electron)
 *
 * In Electron-OH single-window mode, `electron.windows.get(target)` returns
 * the current window itself, so `send("fileOpen")` would IPC back to us —
 * pointless. Instead, set `currentFile` (the cross-view import layer) and
 * navigate via SvelteKit `goto()`. The target view's mount hook reads
 * `currentFile` and loads the file itself.
 *
 * @param {string} file File to open
 * @param {string} target Window to open in
 */
export async function openIn(file, target) {
    // ★ 切窗口前先落 localStorage（goto SPA 跳转后 JS 内存 $state 会丢，必须落盘）
    // goto 跳转后 target 视图 mount 时从 localStorage 读回文件（sharedViewStore.consumeCurrentFile）
    // ★★ source 不设成 target — source 是"文件来源视图"，consumeCurrentFile(target) 判 source===target 才是自回环
    //    设成 target 会让"builder→runner"被误判成 runner 自回环 → 返回 null → 文件丢（runner 不行的根因）
    //    这里保留 null，flushBeforeNavigate 会保留现值；调用方 callbacks 应显式传 source 才准
    const fileObj = (typeof file === 'string')
        ? { file, name: null, ext: null, source: null }
        : { file: file?.file ?? null, name: file?.name ?? null, ext: file?.ext ?? null, source: file?.source ?? null };
    flushBeforeNavigate(target, fileObj);

    if (electron) {
        // ★ 优先走 SvelteKit goto（SPA 跳转，不触发 HTTP 整页重载）
        // — 不重载 Ribbon 布局不塌缩，Terminal 标识保留
        // — localStorage 已落盘，goto 后 target 视图 mount 从 localStorage 恢复文件，不丢
        try {
            await goto(`/${target}`);
            return;
        } catch (_) {
            // goto 失败 — 不 fallback 到 windows.navigate()，避免 HTTP 全量重载
        }
        try {
            await electron.windows.new(target);
            return;
        } catch (_) {}
        if (typeof window !== 'undefined' && typeof window.open === 'function') {
            window.open(resolve(`/${target}`));
        }
    } else {
        window.open(resolve(`/${target}`));
    }
}

/**
 * Show the first of a particular window, or navigate to it.
 * In single-window mode (Electron-OH), navigate the current window
 * to the target URL rather than trying to focus a separate window.
 */
export async function showWindow(target) {
    // ★ 切窗口前落 activeView + 当前文件到 localStorage（goto 跳转后从这里恢复）
    flushBeforeNavigate(target, null);

    if (electron) {
        // try to find and focus existing window
        let windows;
        try {
            windows = await electron.windows.get(target);
        } catch (_) {
            windows = [];
        }
        if (windows && windows.length) {
            await electron.windows.focus(windows[0])
            return
        }
        // ★ 优先走 SvelteKit goto（SPA 跳转，不重载，保 Terminal 标识、Ribbon 布局不塌）
        // localStorage 已落盘，goto 后 target 视图 mount 从 localStorage 恢复文件
        try {
            await goto(`/${target}`)
            return
        } catch (_) {
            // goto failed — do NOT fallback to windows.navigate() (triggers HTTP full reload)
        }
    }
    // fallback (browser/dev mode): SvelteKit goto
    goto(`/${target}`)
}

/**
 * Show the devtools panel in the current window
 */
export function showDevTools() {
    if (electron) {
        electron.windows.devtools()
    }   
}