// Public i18n API for PsychoPy Studio OH.
//
// This is a PLAIN `.js` module on purpose: it must be importable from anywhere
// (including during SSR) without depending on Svelte runes. The reactive
// `$state` store lives in `./store.svelte.js` (a `.svelte.js` module where the
// Svelte compiler injects runes). Keeping runes out of this file is what fixes
// the 500 Internal Error that occurred because `$state` was previously used
// here at module top level and never transformed by the compiler.
//
// Usage in components:
//   import { t, setLang, getLang, LANGS, i18n } from "$lib/i18n";
//   <span>{t("menu.file")}</span>
//   <button onclick={() => setLang("zh_CN")}>中文</button>
//
// `t()` reads the reactive `i18n.lang` $state (re-exported from store.svelte.js),
// so any {t(...)} expression in a template re-renders automatically when the
// language changes. Untranslated keys fall back to the English source string,
// so the UI is always usable.

import { i18n, setLang, getLang, LANGS, DICTS } from "./store.svelte.js";

/**
 * Translate `key` into the active language.
 * Falls back to en_US, then to the key itself (the English source string), so
 * anything not yet translated still renders intelligibly. Supports `{var}`
 * interpolation through the `vars` object.
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 */
export function t(key, vars) {
    const lang = i18n.lang;
    let str = DICTS[lang]?.[key];
    if (str === undefined) str = DICTS.en_US?.[key];
    if (str === undefined) str = key;
    if (vars && typeof str === "string") {
        for (const [k, v] of Object.entries(vars)) {
            str = str.replaceAll(`{${k}}`, v ?? "");
        }
    }
    return str;
}

// Re-export the reactive store + helpers so existing importers
// (`LangSwitch.svelte`, `Dialog.svelte`, etc.) keep working unchanged.
export { i18n, setLang, getLang, LANGS };
