// Reactive i18n store (Svelte 5 runes).
//
// IMPORTANT: this file MUST keep the `.svelte.js` extension. The Svelte
// compiler only injects the `$state` rune into `.svelte` / `.svelte.js` /
// `.svelte.ts` files. A plain `.js` module using `$state` is NOT transformed,
// so `$state` stays an undefined identifier and throws a ReferenceError during
// SSR (the original 500 Internal Error on HarmonyOS).
//
// The public, SSR-safe API (`t`, setLang, getLang, LANGS, i18n) is re-exported
// from the plain `./index.js` so every existing `import ... from "$lib/i18n"`
// keeps working without a rune in a non-svelte module.

import enUS from "./en_US.js";
import zhCN from "./zh_CN.js";

export const LANGS = [
    { code: "zh_CN", label: "简体中文" },
    { code: "en_US", label: "English" }
];

// Source language is en_US; zh_CN overrides specific keys.
export const DICTS = {
    en_US: enUS,
    zh_CN: zhCN
};

const STORAGE_KEY = "psychopy-studio:lang";

function _readLang() {
    // 1) explicit user choice, persisted
    if (typeof localStorage !== "undefined") {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && LANGS.some((l) => l.code === saved)) return saved;
        } catch (_) { /* ignore */ }
    }
    // 2) fall back to the OS / browser locale (Chinese devices → 简体中文)
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("zh")) {
        return "zh_CN";
    }
    // 3) default
    return "en_US";
}

// Export a $state object and mutate its `.lang` property. (Svelte 5 forbids
// reassigning an exported $state binding, but property mutation is fine and
// stays fully reactive.)
export const i18n = $state({
    lang: _readLang()
});

export function getLang() {
    return i18n.lang;
}

export function setLang(code) {
    if (!LANGS.some((l) => l.code === code)) return;
    i18n.lang = code;
    if (typeof localStorage !== "undefined") {
        try { localStorage.setItem(STORAGE_KEY, code); } catch (_) { /* ignore */ }
    }
    // Best-effort: let the host shell (Electron / OpenHarmony) persist locale too.
    try {
        if (typeof window !== "undefined" && window.electron?.locale?.set) {
            window.electron.locale.set(code);
        }
    } catch (_) { /* ignore */ }
}
