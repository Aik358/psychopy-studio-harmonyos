<script>
    import { i18n, setLang, LANGS } from "$lib/i18n";
</script>

<div class="lang-switch" role="group" aria-label="Language">
    {#each LANGS as lang}
        <button
            class:active={i18n.lang === lang.code}
            aria-pressed={i18n.lang === lang.code}
            onclick={() => setLang(lang.code)}
        >{lang.label}</button>
    {/each}
</div>

<style>
    .lang-switch {
        display: inline-flex;
        flex-direction: row;
        gap: .25rem;
        align-items: center;
        min-width: 120px;
        flex-shrink: 0;
    }
    .lang-switch button {
        font-size: .7rem;
        padding: .25rem .5rem;
        border: 1px solid var(--overlay);
        background: var(--base);
        color: var(--text);
        border-radius: .25rem;
        cursor: pointer;
    }
    .lang-switch button:hover {
        border-color: var(--blue);
    }
    .lang-switch button.active {
        background: var(--blue);
        color: var(--text-on-blue, #fff);
        border-color: var(--blue);
    }
</style>
